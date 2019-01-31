import { Sites, OpenshiftEnvs, Types, Themes } from "../both";
import { check } from "meteor/check";

Meteor.publish('sites.list', function() {
    
    let siteCursor = Sites.find(
        {}, 
        { sort: {url: 1}, }
    );

    return [
        siteCursor,
    ];
});

Meteor.publish('site.single', function(siteId) {

    check(siteId, String);
    
    let siteCursor = Sites.find({_id: siteId});
    return [
        siteCursor,
    ]; 
});

Meteor.publish('openshiftEnv.list', function() {
    
    let openshiftEnvCursor = OpenshiftEnvs.find({}, {sort: {name:1}});
    return [
        openshiftEnvCursor,
    ]
});

Meteor.publish('theme.list', function() {
    
    let themeCursor = Themes.find({}, {sort: {name:1}});
    return [
        themeCursor,
    ]
});

Meteor.publish('type.list', function() {
    
    let typeCursor = Types.find({}, {sort: {name:1}});
    return [
        typeCursor,
    ]
});

