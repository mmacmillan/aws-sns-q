/**
 * sns-q, a promise interface for the AWS Sns SDK
 *
 * @author Mike MacMillan (mikejmacmillan@gmail.com)
 */

var Q = require('q'),
    _ = require('lodash'),
    aws = require('aws-sdk');


var application = {
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
    }

};




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
    this.sns = new aws.SNS(opt)
    this.svc = {};

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
}

module.exports = snsQ;
