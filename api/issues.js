const express = require('express');
const sqlite3 = require('sqlite3');

const issuesRouter = express.Router({mergeParams: true});

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

issuesRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Issue WHERE series_id = ${req.params.seriesId}`, (err, rows) => {
    if (err) {
      next(err);
    } else {
      res.status(200).send({ issues: rows });
    }
  })
});

issuesRouter.post('/', (req, res, next) => {
  const name = req.body.issue.name;
  const issueNumber = req.body.issue.issueNumber;
  const publicationDate = req.body.issue.publicationDate;
  const artistId = req.body.issue.artistId;
  if (!name || !issueNumber || !publicationDate || !artistId) {
    res.status(400).send();
  } else {
    db.get(`SELECT * FROM Artist WHERE id = ${artistId}`, (err, row) => {
      if (!row) {
        res.status(400).send();
      } else {
        const sql = 'INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ($name, $issue_number, $publication_date, $artist_id, $series_id)';
        const values = {$name: name, $issue_number: issueNumber, $publication_date: publicationDate, $artist_id: artistId, $series_id: req.series.id};
        db.run(sql, values, function (err) {
          if (err) {
            next(err);
          } else {
            db.get(`SELECT * FROM Issue WHERE id = ${this.lastID}`, (err, row) => {
                res.status(201).send({ issue: row });
            });
          }
        });
      }
    });
  }
});

issuesRouter.param('issueId', (req, res, next, issueId) => {
  db.get(`SELECT * FROM Issue WHERE id = ${issueId}`, (err, row) => {
    if (err) {
      next(err);
    } else {
      if (!row) {
        res.status(404).send();
      } else {
        req.issue = row;
        next();
      }
    }
  });
});

issuesRouter.put('/:issueId', (req, res, next) => {
  const name = req.body.issue.name;
  const issueNumber = req.body.issue.issueNumber;
  const publicationDate = req.body.issue.publicationDate;
  const artistId = req.body.issue.artistId;
  if (!name || !issueNumber || !publicationDate || !artistId) {
    res.status(400).send();
  } else {
    db.get(`SELECT * FROM Artist WHERE id = ${artistId}`, (err, row) => {
      if (!row) {
        res.status(400).send();
      } else {
        const sql = 'UPDATE Issue SET name = $name, issue_number = $issue_number,  publication_date = $publication_date, artist_id = $artist_id, series_id = $series_id WHERE id = $id';
        const values = {$name: name, $issue_number: issueNumber, $publication_date: publicationDate, $artist_id: artistId, $series_id: req.series.id, $id: req.params.issueId};
        db.run(sql, values, (err) => {
          if (err) {
            next(err);
          } else {
            db.get(`SELECT * FROM Issue WHERE id = ${req.params.issueId}`, (err, row) => {
                res.status(200).send({ issue: row });
            });
          }
        });
      }
    });
  }
});

issuesRouter.delete('/:issueId', (req, res, next) => {
  db.get(`SELECT * FROM Issue WHERE id = ${req.params.issueId}`, (err, row) => {
    if (err) {
      next(err);
    } else {
      if (!row) {
        res.status(404).send();
      } else {
        db.run(`DELETE FROM Issue WHERE id = ${req.params.issueId}`, (err) => {
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

module.exports = issuesRouter;
