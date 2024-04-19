require("dotenv").config();

const express = require("express");
const app = express();

const cors = require("cors");
app.use(cors());

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

const inMemoryStorage = [];

const findUser = (id) => inMemoryStorage.find(user => user._id == id);

const newUser = (username) => {
    const user = {
        username: username,
        count: 0,
        log: []
    };
    user._id = inMemoryStorage.push(user) + "";

    return user;
}

const newExercise = (user, description, duration, date) => {
    user.log.push({
        description: description,
        duration: duration,
        date: date
    });
    user.count = user.log.length;

    return user.log[user.log.length - 1];
}

app.get("/api/users", (req, res) => {
    res.json(inMemoryStorage.map(user => ({
        username: user.username,
        _id: user._id
    })));
});

app.post("/api/users", (req, res) => {
    if (!req.body.username) {
        return res.json({ error: "Invalid Username" });
    }

    const user = newUser(req.body.username);

    res.json({
        username: user.username,
        _id: user._id
    });
});

app.post("/api/users/:_id/exercises", (req, res) => {
    if (!req.params._id || isNaN(req.params._id)) {
        return res.json({ error: "Invalid Id" });
    }

    if (!req.body.description) {
        return res.json({ error: "Invalid Description" });
    }

    if (!req.body.duration || isNaN(req.body.duration)) {
        return res.json({ error: "Invalid Duration" });
    }

    const user = findUser(req.params._id);
    if (!user) {
        return res.json({ error: "No user for the gived id could be found" });
    }

    const exercise = newExercise(user, req.body.description, Number(req.body.duration), !req.body.date ? new Date() : new Date(req.body.date));

    res.json({
        _id: user._id,
        username: user.username,
        date: exercise.date.toDateString(),
        duration: exercise.duration,
        description: exercise.description
    });

});

app.get("/api/users/:_id/logs", (req, res) => {
    if (!req.params._id || isNaN(req.params._id)) {
        return res.json({ error: "Invalid Id" });
    }

    const user = structuredClone(findUser(req.params._id));
    if (!user) {
        return res.json({ error: "No user for the gived id could be found" });
    }

    if (req.query.from) {
        const from = new Date(req.query.from);
        user.log = user.log.filter(exercise => exercise.date >= from);
    }

    if (req.query.to) {
        const to = new Date(req.query.to);
        user.log = user.log.filter(exercise => exercise.date < to);
    }

    if (req.query.limit) {
        const limit = Number(req.query.limit);
        user.log = user.log.slice(0, limit);
    }

    user.log = user.log.map(exercise => {
        exercise.date = exercise.date.toDateString();
        return exercise;
    });
    user.count = user.log.length;

    res.json(user);
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log(`Your app is listening on port ${listener.address().port}`);
})
