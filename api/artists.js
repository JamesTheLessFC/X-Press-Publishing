const express = require('express');
const sqlite3 = require('sqlite3');

const artistsRouter = express.Router();

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

artistsRouter.get('/', (req, res, next) => {
  db.all("SELECT * FROM Artist WHERE is_currently_employed = 1", (err, rows) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({artists: rows});
    }
  });
});

artistsRouter.param('artistId', (req, res, next, artistId) => {
  db.get(`SELECT * FROM Artist WHERE id = ${artistId}`,
  (err, row) => {
    if (err) {
      next(err);
    } else {
      if (!row) {
        res.status(404).send();
      } else {
        req.artist = row;
        next();
      }
    }
  });
});

artistsRouter.get('/:artistId', (req, res, next) => {
  res.status(200).json({artist: req.artist});
});

artistsRouter.post('/', (req, res, next) => {
  const name = req.body.artist.name;
  const dateOfBirth = req.body.artist.dateOfBirth;
  const biography = req.body.artist.biography;
  if (!name || !dateOfBirth || !biography) {
    res.status(400).send();
  } else {
    const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
    db.run("INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, $date_of_birth, $biography, $is_currently_employed)",
    {
      $name: name,
      $date_of_birth: dateOfBirth,
      $biography: biography,
      $is_currently_employed: isCurrentlyEmployed
    },
    function (err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Artist WHERE id = ${this.lastID}`,
        (err, row) => {
          res.status(201).send({ artist: row });
        });
      }
    });
  }
});

artistsRouter.put('/:artistId', (req, res, next) => {
  const name = req.body.artist.name;
  const dateOfBirth = req.body.artist.dateOfBirth;
  const biography = req.body.artist.biography;
  if (!name || !dateOfBirth || !biography) {
    res.status(400).send();
  } else {
    const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
    const sql = "UPDATE Artist SET name = $name, date_of_birth = $date_of_birth, biography = $biography, is_currently_employed = $is_currently_employed WHERE id = $id";
    const values = {
      $name: name,
      $date_of_birth: dateOfBirth,
      $biography: biography,
      $is_currently_employed: isCurrentlyEmployed,
      $id: req.params.artistId
    };
    db.run(sql, values, (err) => {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Artist WHERE id = ${req.params.artistId}`,
        (err, row) => {
            res.status(200).send({ artist: row });
        });
      }
    });
  }
});

artistsRouter.delete('/:artistId', (req, res, next) => {
  db.run(`UPDATE Artist SET is_currently_employed = 0 WHERE id = ${req.params.artistId}`,
  (err) => {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Artist WHERE id = ${req.params.artistId}`,
      (err, row) => {
          res.status(200).send({ artist: row });
      });
    }
  });
});

module.exports = artistsRouter;
