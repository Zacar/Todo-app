require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const userName = process.env.USER_MONGO;
const mongoKey = process.env.USER_KEY;
const dbName = process.env.DB_NAME;

mongoose.connect(
  `mongodb+srv://${userName}:${mongoKey}@cluster0.oeamqqb.mongodb.net/${dbName}?retryWrites=true&w=majority&appName=Cluster0`
);

const itemSchema = new mongoose.Schema({
  name: String,
});

const listSchema = {
  name: String,
  items: [itemSchema],
};
const List = mongoose.model("List", listSchema);

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "welcome to the todolist",
});
const item2 = new Item({
  name: "hit the + button to add a new item",
});
const item3 = new Item({
  name: "<-- Hit this to delete an item>",
});

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  Item.find().then(function (items) {
    if (items.length === 0) {
      Item.insertMany(defaultItems)
        .then(() => {
          console.log("successfully inserted");
        })
        .catch(function (err) {
          console.log(err);
        });

      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: items });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item4 = new Item({
    name: itemName,
  });
  if (listName === "Today") {
    item4.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((foundList) => {
      foundList.items.push(item4);
      foundList.save().then(() => {
        res.redirect("/" + listName);
      });
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId).catch((err) => {
      console.log(err);
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.get("/:paramName", function (req, res) {
  const new_param = _.capitalize(req.params.paramName);
  List.findOne({ name: new_param }).then((results) => {
    if (!results) {
      const list = new List({
        name: new_param,
        items: defaultItems,
      });
      list.save().then(() => {
        res.redirect("/" + new_param);
      });
    } else {
      res.render("list", {
        listTitle: results.name,
        newListItems: results.items,
      });
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.post("/newList", function (req, res) {
  const new_list = req.body.newItem;
  res.redirect("/" + new_list);
});

const port = process.env.PORT || 3000;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
