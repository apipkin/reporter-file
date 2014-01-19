
var mocha = require('mocha'),
    fs = require('fs'),
    js2xml = require('js2xmlparser'),

    config = require('../config'),

    Base = mocha.reporters.Base,

    reporterName = process.env.MOCHA_REPORTER || config.reporter || 'XUnit',
    Reporter = mocha.reporters[reporterName],

    filePath = process.env.MOCHA_REPORTER_FILE || config.file || process.cwd() + "/xunit.xml";



function ReporterFile(runner) {

    Reporter.call(this, runner);

    var stats = this.stats,
        tests = [];

    runner.on('test', function(test){
        tests.push(test);
    });

    runner.on('end', function(){

        var data = {
                '@': {
                    name: 'Mocha Tests',
                    tests: stats.tests,
                    failures: stats.failures,
                    errors: stats.failures,
                    skipped: stats.tests - stats.failures - stats.passes,
                    timestamp: (new Date).toUTCString(),
                    time: stats.duration / 1000
                },
                'testcase': tests.map(function (test) {
                    var data = {
                        '@': {
                            classname: test.parent.fullTitle(),
                            name: test.title,
                            time: test.duration ? test.duration / 1000 : 0
                        }
                    };

                    if (test.state === 'failed') {
                        data.failure = {
                            '@': {
                                message: test.err.message
                            },
                            '#': test.err.stack
                        }
                    } else if (test.state === 'pending') {
                        delete data['@'].time;
                        data.skipped = '';
                    }

                    return data;
                })
            },

            output = js2xml('testsuite', data) + '\n',

            writeErr = fs.writeFileSync(filePath, output);

            if (writeErr) {
                throw writeErr;
            }

            console.log('> Report was written to: ' + filePath + '\n');

    });
}

// Inherit from the specified reporter
ReporterFile.prototype = Reporter.prototype;


module.exports = ReporterFile;
