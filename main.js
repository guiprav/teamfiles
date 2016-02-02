'use strict';

var fs = require('fs');
var readTextFileSync = require('read-text-file-sync');
var mkdirp = require('mkdirp');
var path = require('path');
var extname = path.extname;
var basename = path.basename;
var realpathSync = fs.realpathSync;
var express = require('express');
var app = express();
var multer = require('multer');
var upload = multer({ dest: './uploads' });
var uploadPage = readTextFileSync(__dirname + '/upload.html');
var key = process.env.TEAMKEY;

if(!key) {
    console.error("Missing TEAMKEY.");
    process.exit(-1);
}

function keyCheck(req, res, next) {
    if(req.params.key !== key) {
        res.status(403);
        res.send("Bad team key.");
        return;
    }

    next();
}

app.get('/upload/:key', keyCheck, function(req, res) {
    res.send(uploadPage);
});

app.post('/upload/:key', keyCheck, upload.single('file'), function(req, res) {
    var originalPath = './uploads/' + req.file.filename;
    var newPath = originalPath + extname(req.file.originalname);
    var newPathBaseName = basename(newPath);
    var refDirPath = './refs/' + req.file.originalname;
    var refPath = refDirPath + '/' + newPathBaseName;
    var relUrl;

    fs.renameSync(originalPath, newPath);
    fs.symlinkSync(newPathBaseName, originalPath);

    mkdirp.sync(refDirPath);
    fs.symlinkSync('../../uploads/' + newPathBaseName, refPath);

    relUrl = '/' + basename(originalPath) + '/' + req.file.originalname;

    if(req.get('User-Agent').startsWith('curl/')) {
        res.send(relUrl);
    }
    else {
        res.redirect(relUrl);
    }
});

app.use(function(req, res, next) {
    var urlPath = req.url;
    var reResults;

    reResults = /^(\/[^\/]+)/.exec(urlPath);

    if(!reResults) {
        next();
        return;
    }

    req.url = reResults[1];

    next();
});

{
    let mime = express.static.mime;

    let originalFn = mime.lookup;

    mime.lookup = function (path, fallback) {
        if(fs.existsSync(path)) {
            path = realpathSync(path);
        }

        return originalFn.call(this, path, fallback);
    };
}

app.use(express.static('./uploads'));

app.listen(process.env.PORT || 3000);
