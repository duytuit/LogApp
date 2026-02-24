const express = require("express");
const { Client } = require("@elastic/elasticsearch");

const app = express();
app.use(express.json());

const client = new Client({
  node: "https://103.69.188.102:9292",
  auth: {
    username: "elastic",
    password: "g8*6DY9+9uEi14pWKpV2"
  },
  tls: {
    rejectUnauthorized: false
  }
});

const indexName = "app_contents";


// ========================
// CREATE / UPDATE
// ========================
app.post("/save", async (req, res) => {
  try {
    const data = req.body;

    await client.index({
      index: indexName,
      id: data.id,
      document: data
    });

    res.json({ message: "Saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// ========================
// GET BY ID
// ========================
app.get("/get/:id", async (req, res) => {
  try {
    const result = await client.get({
      index: indexName,
      id: req.params.id
    });

    res.json(result._source);
  } catch (err) {
    res.status(404).json({ error: "Not found" });
  }
});

app.get("/search", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const appName = req.query.appName;

    const from = (page - 1) * pageSize;

    const result = await client.search({
      index: "app_contents",
      from: from,
      size: pageSize,
      query: {
        bool: {
          must: appName
            ? [{ match: { app: appName } }]
            : [{ match_all: {} }],
          filter: [
            { term: { deleted_at: null } }
          ]
        }
      },
      sort: [
        { created_at: { order: "desc" } }
      ]
    });

    res.json({
      total: result.hits.total.value,
      page: page,
      pageSize: pageSize,
      totalPages: Math.ceil(result.hits.total.value / pageSize),
      data: result.hits.hits.map(x => x._source)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
app.listen(3000, () => {
  console.log("Server running on port 3000");
});