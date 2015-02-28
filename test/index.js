var assert = require('assert'),
    _ = require('lodash'),
    config = require('./config'),
    snsQ = require('../sns-q');

var sns = new snsQ({
    region: config.snsRegion,
    accessKeyId: config.snsUserKey,
    secretAccessKey: config.snsUserSecret,
    sandbox: true
});

console.log('tests use:');
console.log('    PlatformApplicationArn:', config.platformApplicationArn);
console.log('    iOS Device Token:', config.iosDeviceToken);

/*
 * PlatformApplication Tests
 */
describe('Applications', function() {
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
describe('Endpoints' , function() {
    var endpointArn = null;

    this.timeout(config.timeout);

    it('can create endpoint for application', function(done) {
        sns.endpoint.create(config.platformApplicationArn, config.iosDeviceToken).then(function(data) {
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
        var changes = { CustomUserData: "" };

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

    it('can receive a message with a custom payload', function(done) {
        sns.endpoint.message(endpointArn, 'test custom message!', {
            fieldOne: 'Value One',
            fieldTwo: 'Value Two'
        }).then(function(result) {
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
    var topicArn = null,
        subscriptionArn = null;

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

    it('can subscribe mobile devices', function(done) {
        sns.endpoint.create(config.platformApplicationArn, config.iosDeviceToken).then(function(data) {
            endpointArn = data.EndpointArn;

            //** subscribe, expecting immediate confirmation; if the user already consented to push
            //** then they will not need to confirm this subscription
            sns.topic.subscribeMobile(topicArn, endpointArn).then(function(result) {
                subscriptionArn = result

                assert(result && !!result.SubscriptionArn);
                done();
            }, done);
        }, done);
    });

    it('can send messages to subscribers', function(done) {
        sns.topic.message(topicArn, 'test topic message').then(function(result) {
            done();
        }, done);
    });


/*
    it('can be deleted', function(done) {
        sns.topic.delete(topicArn).then(function(result) {
            assert(!!result.ResponseMetadata);
            done();
        }, done);
    });
*/
});


describe('Building Messages', function() {
    describe('Topic Messages', function() {
        it('messages include a "default" platform entry', function() {
            var msg = sns.messageBuilder('this is a test')
                .platforms(['APNS'])
                .toJSON();

            assert(!!msg.default);
        });

    });
    
    describe('APNS Messages', function() {
        it('can build messages for APNS', function() {
            var msg = sns.messageBuilder('this is a test')
                .platforms(['APNS'])
                .toJSON();

            assert(!!msg.APNS);
        });

        it('can build a message that includes a badge update', function() {
            var msg = sns.messageBuilder('this is a test')
                .platforms(['APNS'])
                .showBadge(2)
                .toJSON();

            assert(!!msg.APNS);

            var obj = JSON.parse(msg.APNS);
            assert(!!obj.aps.badge && obj.aps.badge == 2);
        });

        it('can build a message that includes a custom payload', function() {
            var msg = sns.messageBuilder('this is a test', { someKey: 'someValue' })
                .platforms(['APNS'])
                .toJSON();

            assert(!!msg.APNS);

            var obj = JSON.parse(msg.APNS);
            assert(!!obj.aps.alert.someKey);
        });
    });
});
