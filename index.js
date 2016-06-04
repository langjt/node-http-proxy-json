var zlib = require('zlib');
var concatStream = require('concat-stream');

/**
 * Modify the response of json
 * @param res {Response} The http response
 * @param contentEncoding {String} The http header content-encoding: gzip/deflate
 * @param callback {Function} Custom modified logic
 */
module.exports = function modifyResponse(res, contentEncoding, callback) {
    var unzip, zip;
    // Now only deal with the gzip and deflate content-encoding.
    if (contentEncoding === 'gzip') {
        unzip = zlib.Gunzip();
        zip = zlib.Gzip();
    } else if (contentEncoding === 'deflate') {
        unzip = zlib.Inflate();
        zip = zlib.Deflate();
    }

    // The cache response method can be called after the modification.
    var _write = res.write;
    var _end = res.end;

    if (unzip) {
        unzip.on('error', function (e) {
            console.log('Unzip error: ', e);
            _end.call(res);
        });
    } else {
        console.log('Not supported content-encoding: ' + contentEncoding);
        return;
    }

    // The rewrite response method is replaced by unzip stream.
    res.write = function (data) {
        unzip.write(data);
    };

    res.end = function (data) {
        unzip.end(data);
    };

    // Concat the unzip stream.
    var concatWrite = concatStream(function (data) {
        var body;
        try {
            body = JSON.parse(data.toString());
        } catch (e) {
            body = data.toString();
            console.log('JSON.parse error:', e);
        }

        // Custom modified logic
        if (typeof callback === 'function') {
            body = callback(body);
        }

        // Converts the JSON to buffer.
        body = new Buffer(JSON.stringify(body));

        // Call the response method and recover the content-encoding.
        zip.on('data', function (chunk) {
            _write.call(res, chunk);
        });
        zip.on('end', function () {
            _end.call(res);
        });

        zip.write(body);
        zip.end();
    });
    unzip.pipe(concatWrite);
};
