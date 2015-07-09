#aws-sns-q

>Provides a facade around the [AWS SNS NodeJS SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SNS.html), introducing a promise interface using [Q](https://github.com/kriskowal/q).  


The [Amazon Simple Notification Service](http://docs.aws.amazon.com/sns/latest/dg/welcome.html) is a web service that provides centralized message delivery services, making it easy to send messages via email, sms, mobile push, http, etc. to your "subscribers".  The support for [mobile push notifications](http://docs.aws.amazon.com/sns/latest/dg/SNSMobilePush.html) is what makes SNS extra awesome, because it allows developers to learn a single API to target most major mobile device platforms (APS, GCM, ADM).

###What is this library for?

This library, `snsQ`, aims to provide a facade over the SNS SDK, both introducing a promise interface via Q, and a bit of reorganization to the service interface.  ex:

```js
sns.applicaton.endpoints(platformAppArn).then(function(data) {
	var tasks = _.map(data.Endpoints, sns.endpoint.get);
    Q.all(tasks).then(function(res) {
    	...
    });
});
```

###How do you use snsQ?

Initializing `snsQ` is the same as initializing the AWS SDK:

```js
var sns = new snsQ({
    region: 'us-west-1',
    accessKeyId: 'api-key',
    secretAccessKey:'api-secret'
});
```

The `snsQ` library is separated into three high level objects:


###sns.application
* create(name, platform, attributes)
* get(arn)
* update(arn, attributes)
* list(token)
* endpoints(arn, token)
* delete(arn)

###sns.endpoint
* create(arn, token, data, attributes)
* get(arn)
* update(arn, attributes)
* delete(arn)
* message(arn, message, args)

###sns.topic
* create(name)
* get(arn)
* update(arn, name, value)
* list(token)
* delete(arn)
* subscribe(arn, endpint, protocol)
* subscribeMobile(topicArn, endpointArn)





#Running the Tests
Run the included tests either using `mocha test` or `npm test`.   The tests require some configuration before running; the following settings should be added to `tests/config.js`:
* platformApplicationArn
* iosDeviceToken
* snsRegion
* snsUserKey
* snsUserSecret





#Documentation
## application

#### application.create(name, platform, attributes) 

creates a platform application object for the specified service

for more information regarding the additional attributes, see: 
http://docs.aws.amazon.com/sns/latest/api/API_SetPlatformApplicationAttributes.html

**Parameters**

* **name**: `String`, name of the platformApplication object

* **platform**: `String`, the platform this application object targets (APNS, GCM, ADM)

* **attributes**: `Object`, additional attributes provided

#### application.get(arn) 

gets the platform application object's attributes

**Parameters**

* **arn**: `String`, the PlatformApplicationArn of the target platform application


#### application.update(arn, attributes) 

updates the attributes for the specified platformApplicationArn

**Parameters**

* **arn**: `String`, the PlatformApplicationArn of the target platform application

* **attributes**: `Object`, the Attributes map; a collection of fields to update


#### application.list(token) 

returns a list of all platform applications for this account; supports "pagination" if more than 100 results returned

**Parameters**

* **token**: `String`, the token returned from the previous call, to access the next set of objects


#### application.endpoints(arn, token) 

returns a list of all endpoints for the specified platform application

**Parameters**

* **arn**: `String`, the PlatformApplicationArn of the application to list endpoints for

* **token**: `String`, the token returned from the previous call, to access the next set of objects


#### application.delete(arn) 

deletes the target platform application object

**Parameters**

* **arn**: `String`, the PlatformApplicationArn of the target platform application


## endpoint

#### endpoint.create(name, platform, attributes) 

creates an endpoint for a device, within the specified application

**Parameters**

* **name**: `String`, name of the platformApplication object

* **platform**: `String`, the platform this application object targets (APNS, GCM, ADM)

* **attributes**: `Object`, additional attributes provided

for more information regarding the additional attributes, see: 
http://docs.aws.amazon.com/sns/latest/api/API_SetEndpointAttributes.html


#### endpoint.get(arn) 

gets the endpoint object's attributes

**Parameters**

* **arn**: `String`, the EndpointArn of the target endpoint


#### endpoint.update(arn, attributes) 

updates the attributes for the specified endpoint

**Parameters**

* **arn**: `String`, the EndpointArn of the target platform endpoint

* **attributes**: `Object`, the Attributes map; a collection of fields to update


#### endpoint.delete(arn) 

deletes the target platform application object

**Parameters**

* **arn**: `String`, the PlatformApplicationArn of the target platform application


#### endpoint.message(arn, msg, args) 

sends a message to the target endpoint.  accepts either a string message, or a message object.  if
an object is provided, it is assumed to include the message configuration for each platform intended. 
use an object if you intend to update the badge/count, play a sound, etc.  Make sure each
platforms message object is in string format (JSON.stringify).  see here for more details on targetting
multiple platforms with a single message:

http://docs.aws.amazon.com/sns/latest/dg/mobile-push-send-custommessage.html

also, and object of arguments may be specified, that based on the platform, will be attached to the 
paylod; this can be used for routing, actions, etc

**Parameters**

* **arn**: `String`, the EndpointArn of the endpoint that should receive the message

* **msg**: `String`, the message string to send, or a message object

* **args**: `Object`, additional arguments to be mixed in with the message object



## topic

#### topic.create(name) 

creates a topic with the given name, or returns the existing topic

**Parameters**

* **name**: `String`, name of the topic


#### topic.get(arn) 

gets the topic object's attributes

**Parameters**

* **arn**: `String`, the TopicArn of the target topic


#### topic.update(arn, name, value) 

updates the attributes for the specified topic.  only a few of the attributes can be updated, those
being: Policy, DisplayName, and DeliveryPolicy

**Parameters**

* **arn**: `String`, the TopicArn of the target topic

* **name**: `String`, the name of the attribute to update

* **value**: `String`, the value of the attribute to update


#### topic.list(token) 

returns a list of all topics for this account

**Parameters**

* **token**: `String`, the token returned from the previous call, to access the next set of objects


#### topic.delete(arn) 

deletes the target topic object

**Parameters**

* **arn**: `String`, the TopicArn of the topic to delete


#### topic.subscribeMobile() 

shorthand for device specific registrations, assumes the endpoint is an arn, and presets the protocol 
to 'application', which is used for mobile devices


#### topic.messageBuilder(msg, args) 

a message builder to abstract the individual format for each platform; supports a message, badges, and custom payloads

**Parameters**

* **msg**: `String`, the message we are building platform specific representations of

* **args**: `Object`, individual platform specific payload arguments (optional)


