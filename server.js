const express = require("express");
const morgan = require("morgan");
const db = require("better-sqlite3")("LIC.db");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("works fine");
});

app.post("/add-insurance", (req, res) => {
  try {
    let { name, details, agents, type } = req.body;
    const newInsurance = db.prepare(
      "INSERT INTO Insurance(insurance_name,insurance_details, status, type) VALUES (@name, @details ,1,@type)"
    );
    const assignAgents = db.prepare(
      "INSERT INTO AssignedAgents(iid,aid) VALUES (?, ?)"
    );

    let t = newInsurance.run({ name, details, type });
    for (aid of agents) {
      assignAgents.run(t.lastInsertRowid, aid);
    }
    console.log(t.lastInsertRowid);
    res.send({ message: "done", status: 200 });
  } catch (error) {
    console.log(error);
    res.send({ message: "not done", status: 500 });
  }
});
app.post("/add-agent", (req, res) => {
  try {
    let { name, phno, email, position, details } = req.body;

    const newAgent = db.prepare(
      "INSERT INTO Agent(agent_name,agent_phno,agent_email ,agent_position ,agent_details) VALUES (@name, @phno, @email, @position, @details)"
    );
    newAgent.run({ name, phno, email, position, details });
    res.send({ message: "done", status: 200 });
  } catch (error) {
    res.send({ message: "not done", status: 500 });
  }
});
app.post("/edit-insurance", (req, res) => {
  try {
    let { iid, title, description, status, agents, type } = req.body;
    console.log(iid, title, description, status, agents);

    const updatedInsurance = db.prepare(
      "UPDATE Insurance SET insurance_name=@title , insurance_details=@description , status=@status , type=@type WHERE iid = @iid "
    );
    updatedInsurance.run({ iid, title, description, status, type });
    const deleteAssigned = db.prepare(
      "DELETE FROM AssignedAgents where iid=@iid"
    );

    deleteAssigned.run({ iid });
    const assignAgents = db.prepare(
      "INSERT INTO AssignedAgents(iid,aid) VALUES (?, ?)"
    );
    for (aid of agents) {
      assignAgents.run(iid, aid);
    }
    res.send({ message: "done", status: 200 });
  } catch (error) {
    console.log(error);
    res.send({ message: "not done", status: 500 });
  }
});

app.post("/edit-agent", (req, res) => {
  try {
    let { aid, name, pos, phno, email, details } = req.body;

    const updateAgent = db.prepare(
      "UPDATE Agent SET agent_name=@name , agent_position=@pos ,agent_phno=@phno , agent_email=@email , agent_details=@pos WHERE aid = @aid "
    );
    updateAgent.run({ aid, name, pos, phno, email, details });

    res.send({ message: "done", status: 200 });
  } catch (error) {
    console.log(error);
    res.send({ message: "not done", status: 500 });
  }
});

app.get("/get-insurance/:id", (req, res) => {
  try {
    if (req.params.id != "all") {
      let row = db
        .prepare("SELECT * FROM Insurance WHERE iid=?")
        .get(req.params.id);
      let row2 = db
        .prepare("SELECT * from AssignedAgents where iid=?")
        .all(req.params.id);
      const row3 = db.prepare("SELECT * from Agent where aid=?");
      const agents = row2.map((item) => {
        return row3.get(item.aid);
      });
      row = { ...row, agents };

      res.send({ insurance: row });
    } else if (req.params.id === "all") {
      let row = db.prepare("SELECT * FROM Insurance ").all();

      const row3 = db.prepare("SELECT * from Agent where aid=?");

      row = row.map((item) => {
        let row2 = db
          .prepare("SELECT * from AssignedAgents where iid=?")
          .all(item.iid);
        const agents = row2.map((item) => {
          return row3.get(item.aid);
        });
        return { ...item, agents };
      });
      res.send({ insurance: row });
    } else {
      res.send("bro what");
    }
  } catch (error) {
    console.log(error);
    res.send({ message: "bro what" });
  }
});
app.get("/get-agent/:id", (req, res) => {
  try {
    if (req.params.id != "all") {
      const row = db
        .prepare("SELECT * FROM Agent WHERE aid=?")
        .get(req.params.id);
      res.send({ agent: row });
    } else if (req.params.id === "all") {
      const row = db.prepare("SELECT * FROM Agent ").all();
      res.send({ agent: row });
    } else {
      res.send("bro what");
    }
  } catch (error) {
    console.log(error);
    res.send({ message: "bro what" });
  }
});

app.get("/get-insurance-category/:category", (req, res) => {
  const capitalize = (s) => (s && s[0].toUpperCase() + s.slice(1)) || "";
  console.log(capitalize(req.params.category));
  res.send(
    db
      .prepare("SELECT * from Insurance where type=?")
      .all(capitalize(req.params.category))
  );
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Sever online");
});
