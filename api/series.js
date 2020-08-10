const express = require('express');
const sqlite3 = require('sqlite3');
const issuesRouter = require('./issues');

const seriesRouter = express.Router();

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

seriesRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Series', (err, rows) => {
    res.status(200).send({ series: rows });
  });
});

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
  db.get(`SELECT * FROM Series WHERE id = ${seriesId}`, (err, row) => {
    if (err) {
      next(err);
    } else {
      if (!row) {
        res.status(404).send();
      } else {
        req.series = row;
        next();
      }
    }
  })
});

seriesRouter.get('/:seriesId', (req, res, next) => {
  res.status(200).send({ series: req.series });
});

seriesRouter.post('/', (req, res, next) => {
  const name = req.body.series.name;
  const description = req.body.series.description;
  if (!name || !description) {
    res.status(400).send();
  } else {
    const sql = 'INSERT INTO Series (name, description) VALUES ($name, $description)';
    const values = {$name: name, $description: description};
    db.run(sql, values, function (err) {
      db.get(`SELECT * FROM Series WHERE id = ${this.lastID}`, (err, row) => {
        res.status(201).send({ series: row });
      });
    });
  }
});

seriesRouter.put('/:seriesId', (req, res, next) => {
  const name = req.body.series.name;
  const description = req.body.series.description;
  const id = req.series.id;
  if (!name || !description) {
    res.status(400).send();
  } else {
    const sql = 'UPDATE Series SET name = $name, description = $description WHERE id = $id';
    const values = {$name: name, $description: description, $id: req.params.seriesId};
    db.run(sql, values, (err) => {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Series WHERE id = ${req.params.seriesId}`, (err, row) => {
          res.status(200).send({ series: row });
        });
      }
    });
  }
});

seriesRouter.delete('/:seriesId', (req, res, next) => {
  db.get(`SELECT * FROM Issue WHERE series_id = ${req.params.seriesId}`, (err, row) => {
    if (err) {
      next(err);
    } else {
      if (row) {
        res.status(400).send();
      } else {
        db.run(`DELETE FROM Series WHERE id = ${req.params.seriesId}`, (err) => {
          if (err) {
            next(err);
          } else {
            res.status(204).send();
          }
        });
      }
    }
  });
});

seriesRouter.use('/:seriesId/issues', issuesRouter);

module.exports = seriesRouter;
