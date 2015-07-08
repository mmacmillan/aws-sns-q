/**
 * sns-q, a promise interface for the AWS Sns SDK
 *
 * @author Mike MacMillan (mikejmacmillan@gmail.com)
 */

//**** CURRENTLY only APNS/APNS_SANDBOX is supported

var Q = require('q'),
    _ = require('lodash'),
    aws = require('aws-sdk');

var platforms = {
    ADM: 'ADM',
    GCM: 'GCM',
    APNS: 'APNS',
    APNSSandbox: 'APNS_SANDBOX'
};

var application = {
    /**
     * @class application
     */

    /**
     * creates a platform application object for the specified service
     * 
     * @param {String} name name of the platformApplication object
     * @param {String} platform the platform this application object targets (APNS, GCM, ADM)
     * @param {Object} attributes additional attributes provided
     *
     * for more information regarding the additional attributes, see: 
     * http://docs.aws.amazon.com/sns/latest/api/API_SetPlatformApplicationAttributes.html
     */ 
    create: function(name, platform, attributes) {
        var params = {
            Name: name,
            Platform: platform,
            Attributes: attributes
        };

        return this.svc.createPlatformApplication(params);
    },

    /**
     * gets the platform application object's attributes
     * 
     * @param {String} arn the PlatformApplicationArn of the target platform application
     */
    get: function(arn) {
        var params = { PlatformApplicationArn: arn };
        return this.svc.getPlatformApplicationAttributes(params);
    },

    /** 
     * updates the attributes for the specified platformApplicationArn
     * 
     * @param {String} arn the PlatformApplicationArn of the target platform application
     * @param {Object} attributes the Attributes map; a collection of fields to update
     */
    update: function(arn, attributes) {
        var params = {
            PlatformApplicationArn: arn,
            Attributes: attributes
        };

        return this.svc.setPlatformApplicationAttributes(params);
    },

    /** 
     * returns a list of all platform applications for this account; supports "pagination" if more than 100 results returned
     * 
     * @param {String} token the token returned from the previous call, to access the next set of objects
     */
    list: function(token) {
        return this.svc.listPlatformApplications(token);
    },

    /** 
     * returns a list of all endpoints for the specified platform application
     * 
     * @param {String} arn the PlatformApplicationArn of the application to list endpoints for
     * @param {String} token the token returned from the previous call, to access the next set of objects
     */
    endpoints: function(arn, token) {
        var params = {
            PlatformApplicationArn: arn,
            NextToken: token
        };

        return this.svc.listEndpointsByPlatformApplication(params);
    },

    /**
     * deletes the target platform application object
     * 
     * @param {String} arn the PlatformApplicationArn of the target platform application
     */
    delete: function(arn) {
        var params = { PlatformApplicationArn: arn };
        return this.svc.deletePlatformApplication(params);
    }
};



var endpoint = {
    /**
     * creates an endpoint for a device, within the specified application
     * 
     * @param {String} name name of the platformApplication object
     * @param {String} platform the platform this application object targets (APNS, GCM, ADM)
     * @param {Object} attributes additional attributes provided
     *
     * for more information regarding the additional attributes, see: 
     * http://docs.aws.amazon.com/sns/latest/api/API_SetEndpointAttributes.html
     */ 
    create: function(arn, token, data, attributes) {
        var params = {
            PlatformApplicationArn: arn,
            Token: token,
            CustomUserData: data,
            Attributes: attributes
        };

        return this.svc.createPlatformEndpoint(params);
    },

    /**
     * gets the endpoint object's attributes
     * 
     * @param {String} arn the EndpointArn of the target endpoint
     */
    get: function(arn) {
        var params = { EndpointArn: arn };
        return this.svc.getEndpointAttributes(params);
    },


    /** 
     * updates the attributes for the specified endpoint
     * 
     * @param {String} arn the EndpointArn of the target platform endpoint 
     * @param {Object} attributes the Attributes map; a collection of fields to update
     */
    update: function(arn, attributes) {
        var params = {
            EndpointArn: arn,
            Attributes: attributes
        };

        return this.svc.setEndpointAttributes(params);
    },


    /**
     * deletes the target platform application object
     * 
     * @param {String} arn the PlatformApplicationArn of the target platform application
     */
    delete: function(arn) {
        var params = { EndpointArn: arn };
        return this.svc.deleteEndpoint(params);
    },

    /**
     * sends a message to the target endpoint.  accepts either a string message, or a message object.  if
     * an object is provided, it is assumed to include the message configuration for each platform intended. 
     * use an object if you intend to update the badge/count, play a sound, etc.  Make sure each
     * platforms message object is in string format (JSON.stringify).  see here for more details on targetting
     * multiple platforms with a single message:
     *
     * http://docs.aws.amazon.com/sns/latest/dg/mobile-push-send-custommessage.html
     *
     * also, and object of arguments may be specified, that based on the platform, will be attached to the 
     * paylod; this can be used for routing, actions, etc
     *
     * @param {String} arn the EndpointArn of the endpoint that should receive the message
     * @param {String} msg the message string to send, or a message object
     * @param {Object} args additional arguments to be mixed in with the message object
     */
    message: function(arn, msg, args) {
        var params = {
            Message: typeof(msg) !== 'string' ? JSON.stringify(msg) : {},
            MessageStructure: 'json',
            TargetArn: arn
        };

        //** currently in testing, limited to APNS/APNS_SANDBOX
        if(typeof(msg) === 'string')
            params.Message = messageBuilder(msg, args)
                .platforms(this.platforms)
                .stringify()

        return this.svc.publish(params);
    }
};


var topic = {
    /**
     * creates a topic with the given name, or returns the existing topic 
     * 
     * @param {String} name name of the topic
     */ 
    create: function(name) {
        var params = { Name: name };

        return this.svc.createTopic(params);
    },

    /**
     * gets the topic object's attributes
     * 
     * @param {String} arn the TopicArn of the target topic
     */
    get: function(arn) {
        var params = { TopicArn: arn };
        return this.svc.getTopicAttributes(params);
    },

    /** 
     * updates the attributes for the specified topic.  only a few of the attributes can be updated, those
     * being: Policy, DisplayName, and DeliveryPolicy
     * 
     * @param {String} arn the TopicArn of the target topic
     * @param {String} name the name of the attribute to update
     * @param {String} value the value of the attribute to update
     */
    update: function(arn, name, value) {
        var params = {
            AttributeName: name,
            AttributeValue: value,
            TopicArn: arn
        };

        return this.svc.setTopicAttributes(params);
    },

    /** 
     * returns a list of all topics for this account
     * 
     * @param {String} token the token returned from the previous call, to access the next set of objects
     */
    list: function(token) {
        return this.svc.listTopics(token);
    },


    /**
     * deletes the target topic object
     * 
     * @param {String} arn the TopicArn of the topic to delete
     */
    delete: function(arn) {
        var params = { TopicArn: arn };
        return this.svc.deleteTopic(params);
    },


    subscribe: function(topicArn, endpoint, protocol) {
        var params = {
            TopicArn: topicArn,
            Protocol: protocol,
            Endpoint: endpoint
        };

        return this.svc.subscribe(params);
    },


    /**
      * shorthand for device specific registrations, assumes the endpoint is an arn, and presets the protocol 
      * to 'application', which is used for mobile devices
      */
    subscribeMobile: function(topicArn, endpointArn) {
        var params = {
            TopicArn: topicArn,
            Protocol: 'application',
            Endpoint: endpointArn 
        };

        return this.svc.subscribe(params);
    },

    message: function(arn, msg, args) {
        var params = {
            Message: typeof(msg) !== 'string' ? JSON.stringify(msg) : {},
            MessageStructure: 'json',
            TopicArn: arn
        };

        //** currently in testing, limited to APNS/APNS_SANDBOX
        if(typeof(msg) === 'string')
            params.Message = messageBuilder(msg, args)
                .platforms(this.platforms)
                .stringify()

        return this.svc.publish(params);
    }
};


/**
 * a message builder to abstract the individual format for each platform; supports a message, badges, and custom payloads
 * 
 * @param {String} msg the message we are building platform specific representations of
 * @param {Object} args individual platform specific payload arguments (optional)
 */
function messageBuilder(msg, args) {
    var message = msg,
        supported = [],
        badge = 0,
        builders = {};

    //** currently only APNS is supported
    builders[platforms.APNS] = builders[platforms.APNSSandbox] = function() {
        return {
            aps: { 
                //** adds the custom arguments onto the "alert" object
                alert: _.extend({}, { body: msg }, args||{}),
                badge: badge
            }
        };
    }

    //** sets the supported platforms
    this.platforms = function(list) {
        if(!Array.isArray(list)) return;
        supported = list;
        return this;
    }

    //** shows/clears badges for the app icon
    this.showBadge = function(count) {
        badge = count;
        return this;
    }
    this.clearBadge = function() {
        badge = 0;
        return this;
    }

    this.toJSON = function() {
        //** create the composite message object based on the supported platforms
        return _.reduce(supported, function(m, platform) {
            if(!!builders[platform])
                m[platform] = JSON.stringify(builders[platform]());

            return m;
        }, 

        //** support the default message inherently; this is required for publishing to topics
        { default: msg });
    }

    this.stringify = function() { return JSON.stringify(this.toJSON()); }

    return this;
}

//** simple wrapper function for introducing a promise interface
function wrap(ctx, fn, key) {
    return function() {
        var def = Q.defer(),
            args = _.toArray(arguments);

        args.push(def.makeNodeResolver());
        fn.apply(ctx, args);

        return def.promise;
    }
}


function snsQ(opt) {
    //** proxy the options unchanged to the aws-sns sdk for creation
    this.sns = new aws.SNS((opt=opt||{}))
    this.svc = {};

    //** default the sandbox status and platform support, if not specified
    this.sandbox = opt.sandbox === true;
    this.platforms = opt.platforms||[platforms.APNS, platforms.GCM, platforms.ADM];

    //** create a curried version of each sns sdk api function, introducing a promise, hoisting it to a service object
    _.each(this.sns.constructor.prototype, function(obj, key) {
        if(typeof(obj) !== 'function' || key == 'constructor') return;
        this.svc[key] = wrap(this.sns, obj, key);
    }.bind(this));

    var scope = function(ctx, fn, key) { 
        ctx[key] = fn.bind(this);
        return ctx;
    }.bind(this);

    //** scope each of the individual service libs
    this.application = _.reduce(application, scope, {}); 
    this.endpoint = _.reduce(endpoint, scope, {}); 
    this.topic = _.reduce(topic, scope, {}); 

    this.messageBuilder = messageBuilder;
}

module.exports = snsQ;
