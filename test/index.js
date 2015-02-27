var assert = require('assert'),
    _ = require('lodash'),
    config = require('./config'),
    snsQ = require('../sns-q');

var sns = new snsQ({
    region: config.snsRegion,
    accessKeyId: config.snsUserKey,
    secretAccessKey: config.snsUserSecret
});


/*
 * PlatformApplication Tests
 */
describe('Application; using PlatformApplicationArn '+ config.platformApplicationArn, function() {
    this.timeout(config.timeout);

    it('should have attributes', function(done) {
        sns.application.get(config.platformApplicationArn).then(function(data) {
            assert(!!data);
            done();
        }, done);
    });

    it('is enabled', function(done) {
        sns.application.get(config.platformApplicationArn).then(function(data) {
            assert(!!data.Attributes.Enabled);
            done();
        }, done);
    });

    it('is cointained within a list of all platform applications for this account', function(done) {
        sns.application.list().then(function(data) {
            var arn = _.find(data.PlatformApplications, function(app) {
                return app.PlatformApplicationArn == config.platformApplicationArn;
            });

            assert(!!arn);
            done();
        }, done);
    });

    it('can have a list of endpoints', function(done) {
        sns.application.endpoints(config.platformApplicationArn).then(function(data) {
            assert(!!data.Endpoints);
            done();
        }, done);
    });


    /*
     *
    it('can be updated', function(done) {
        sns.application.update(config.platformApplicationArn, { 
            //** attributes go here...
        }).then(function(data) {
            done();
        }, done);
    });
    */

    /*
     * do you really need proof!? this kills the platform application object...
     *
    it('can be deleted', function(done) {
        sns.application.delete(config.platformApplicationArn).then(done, done);
    });
    */
});



/*
 * PlatformEndpoint Tests
 */
describe('Endpoint; using iOS device token '+ config.iosDeviceToken, function() {
    var endpointArn = null;

    this.timeout(config.timeout);

    it('can create endpoint for application', function(done) {
        sns.endpoint.create(config.platformApplicationArn, config.iosDeviceToken, "someTag=someValue").then(function(data) {
            //** grab the endpointArn returned, for use in the next test
            endpointArn = data.EndpointArn;

            assert(!!data.EndpointArn);
            done();
        }, done);
    });

    it('should have attributes', function(done) {
        sns.endpoint.get(endpointArn).then(function(data) {
            assert(!!data);
            done();
        }, done);
    });

    it('can be updated', function(done) {
        var changes = { CustomUserData: "someTag=someValue" };

        sns.endpoint.update(endpointArn, changes)
            .then(sns.endpoint.get(endpointArn))
            .then(function(data) {
                assert(!!data.ResponseMetadata);
                done();
            }, done);
    });

    it('can receive a message', function(done) {
        sns.endpoint.message(endpointArn, 'test message!').then(function(result) {
            assert(!!result.ResponseMetadata);
            assert(!!result.MessageId && result.MessageId.length > 0);
            done();
        }, done);
    });

    it('can be deleted', function(done) {
        sns.endpoint.delete(endpointArn).then(function(result) {
            assert(!!result.ResponseMetadata);
            done();
        }, done);
    });
});


/*
 * Topic Tests
 */
describe('Topic', function() {
    var topicArn = null;

    this.timeout(config.timeout);

    it('can create a topic', function(done) {
        sns.topic.create('testTopic').then(function(data) {
            topicArn = data.TopicArn;

            assert(!!data.TopicArn);
            done();
        }, done);
    });

    it('should have attributes', function(done) {
        sns.topic.get(topicArn).then(function(data) {
            assert(data && !!data.Attributes.TopicArn && data.Attributes.TopicArn.length > 0);
            done();
        }, done);
    });

    it('can be updated', function(done) {
        var display = new Date().toGMTString();

        //** update the display name
        sns.topic.update(topicArn, 'DisplayName', display)
            .then(sns.topic.get.bind(sns, topicArn))
            .then(function(topic) {
                //** ensure the updated attribute matches our changes
                assert(!!topic.Attributes && topic.Attributes.DisplayName == display);
                done();
            }, done);

    });

    it('is cointained within a list of all topics for this account', function(done) {
        sns.topic.list().then(function(data) {
            var obj = _.find(data.Topics, function(topic) {
                return topicArn == topic.TopicArn;
            });

            assert(!!obj);
            done();
        }, done);
    });


    it('can be deleted', function(done) {
        sns.topic.delete(topicArn).then(function(result) {
            assert(!!result.ResponseMetadata);
            done();
        }, done);
    });
});
