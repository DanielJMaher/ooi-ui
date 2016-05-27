"use strict";
/*
 * ooiui/static/js/views/platforms/GenericPlatForm.js
 * Builds a list of the arrays subsequent items
 *
 * Dependencies
 * CSS:
 * Partials:
 * - ooiui/static/js/partials/GenericPlatForm.html
 * - ooiui/static/js/partials/GenericPlatFormTable.html
 * Libs
 * - ooiui/static/lib/underscore/underscore.js
 * - ooiui/static/lib/backbone/backbone.js
 * - ooiui/static/js/ooi.js
 * Usage
 */


var Row = Backbone.View.extend({
    tagName:'tbody',
    initialize: function(options){
        _.bindAll(this, "render");
        var self = this;
        this.render();
    },
    template: JST['ooiui/static/js/partials/GenericPlatFormTable.html'],
    render: function(){
        this.$el.html(this.template({model:this.model}));
    }

});

var GenericPlatForm = Backbone.View.extend({

    events: {
        'click .js-expand': '_expand'
    },
    _expand: function(event) {
        var target = $(event.target).data('target');
        $(target).slideToggle();
    },
    initialize: function(options) {
        _.bindAll(this, "render","addTableRows");
        var self = this;

        var platforms = this.collection.fetch({
            data: {order: 'reverse'},
            success:function(collection, response, options){

                // first, lets identify only unique reference designators.
                var uniqueRefDes = _.uniq(collection.pluck('reference_designator'));

                // and identify the index of the model's reference designator in
                // the list of unique items.
                var filtered = collection.filter(function (model) {
                    var index = _.indexOf(uniqueRefDes, model.get('reference_designator'));

                    // if the item DOES exist in the list, lets get into this if ...
                    if (index !== -1) {

                        // once the item is rendered on the page, remove the reference
                        // designator from the unique list, thereby preventing a duplicate
                        // instrument from showing up on the page.
                        uniqueRefDes.splice(index, 1);

                        // and return the model.
                        return model;
                    }
                });

                // I don't really like doing this here...but lets refresh the collection
                // to only what we need.
                self.collection = new StreamCollection(filtered);
                self.collection.fetch({data: {search: 'CP02CNSM' }});

                self.render();
            }
        });
        $.when(platforms).done(function(){
            self.addTableRows();
        });
    },

    addTableRows: function(){
        var self = this;

        this.collection.each(function(model){
            var row = new Row({
                model : model
            });

            var tableID = model.get("reference_designator").substring(0,14);

            self.$el.find("#"+ tableID).append(row.el);

        });
    },
    template: JST['ooiui/static/js/partials/GenericPlatForm.html'],
    render: function() {
        var siteInfo = {
            site: this.collection.models[0].attributes.assetInfo.site,
            refDes: this.collection.models[0].attributes.ref_des.substr(0,8),
        };

        var platformList = this.collection.map(function(model) {
            return  {
                name: model.get('assembly_name'),
                refDes: model.get('reference_designator').substr(0,14),
            };
        });

        var uniqueList = _.uniq(platformList, function(item, key, a) {
            return item.refDes;
        });

        this.$el.html(this.template({collection: uniqueList, siteInfo: siteInfo}));
    }
});