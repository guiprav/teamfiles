'use strict';

var fs = require('fs');
var path = require('path');
var extname = path.extname;
var basename = path.basename;
var express = require('express');
var app = express();
var uploadsPath = 'uploads';
var multer = require('multer');
var upload = multer({ dest: uploadsPath });
var key = process.env.TEAMKEY;

if(!key) {
    console.error("Missing TEAMKEY.");
    process.exit(-1);
}

app.use(function(req, res, next) {
    var urlPath = req.url;
    var reResults;

    if(req.method === 'POST') {
        next();
        return;
    }

    reResults = /^(\/[^\/]+)/.exec(urlPath);

    if(!reResults) {
        next();
        return;
    }

    req.url = reResults[1];

    next();
});

app.use(express.static(uploadsPath));

function keyCheck(req, res, next) {
    if(req.params.key !== key) {
        res.status(403);
        res.send("Bad team key.");
        return;
    }

    next();
}

app.post('/upload/:key', keyCheck, upload.single('file'), function(req, res) {
    var originalPath = uploadsPath + '/' + req.file.filename;
    var newPath = originalPath + extname(req.file.originalname);

    fs.renameSync(originalPath, newPath);

    res.send(basename(newPath) + '/' + req.file.originalname);
});

app.listen(process.env.PORT || 3000);
