define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',

  'i18n'
], function($, _, Backbone, Marionette) {
  'use strict';
  return Marionette.LayoutView.extend({
    template: 'app/modules/stations/templates/tpl-protocols-editor.html',
    className: 'protocol-editor full-height',

    ui: {
      protoMenuContainer: '#protoMenuContainer',
      protoFormsContainer: 'div#protoFormsContainer',
      protoPicker: 'select#protoPicker'
    },

    events: {
      'click #addProto': 'addProtoFromList',
      'click button#addObs': 'addObs',
      'click #protoMenuContainer .js-menu-item': 'getIndex',
    },

    initialize: function(options) {
      var _this = this;
      this.stationId = options.stationId;

      this.collection = new Backbone.Collection();
      this.collection.fetch({
        url: 'stations/' + this.stationId + '/protocols',
        reset: true,
        data: {
          FormName: 'ObsForm',
          DisplayMode: 'edit'
        },
        success: function(data){
          console.log(data);
          _this.initMenu();
          
        },
      });
    },

    displayFirst: function(){
      this.ui.protoMenuContainer.find('.js-menu-item:first').click();
    },

    displayLast: function(){
      this.ui.protoMenuContainer.find('.js-menu-item:last').click();
    },

    initMenu: function() {
      var LytMenuItem = Marionette.LayoutView.extend({
        modelEvents: {
          'change:total': 'updateTotal',
        },

        className: 'js-menu-item noselect clearfix col-xs-12',

        ui: {
          'total' : 'span#total'
        },

        initialize: function(model){
          this.template = 'app/modules/stations/templates/tpl-menuItemView.html';
        },

        updateTotal: function() {
          this.ui.total.html(this.model.get('total'));
        },

        updateVisibility: function() {
          if (this.model.get('current')) {
            this.$el.addClass('active');
          } else {
            this.$el.removeClass('active');
          }
        },
      });

      this.collViewMenu = new Marionette.CollectionView({
        collection : this.collection,
        childView: LytMenuItem,
        className: 'coll-view'
      });
      this.collViewMenu.render();
      this.ui.protoMenuContainer.html(this.collViewMenu.el);
    },


    onRender: function(){
      this.feedProtoPicker();
    },

    feedProtoPicker: function() {
      var _this = this;
      this.ui.protoPicker.append('<option value="" disabled selected>Add a protocol</option>');
      this.protoSelectList = new Backbone.Collection();
      this.protoSelectList.fetch({
        url: '/protocolTypes',
        reset: true,
        success: function() {
          _.each(_this.protoSelectList.models,function(model) {
            _this.ui.protoPicker.append(new Option(model.get('Name'),model.get('ID')));
          },this);
        },
      });
    },

    addProtoFromList: function() {
      var name = this.ui.protoPicker.find(':selected').text();
      var objectType = parseInt(this.ui.protoPicker.val());

      var md = this.collection.findWhere({'ID': objectType});
      if (md) {
        var index = this.collection.indexOf(md);
        this.updateProtoStatus(index);
        this.currentView.addObs();
      }else {
        this.addNewProtoType(name, objectType);
      }
    },

    addNewProtoType: function(name, objectType) {
      var _this = this;

      var proto = new Backbone.Model();

      this.jqxhr = $.ajax({
        url: 'stations/' + this.stationId + '/protocols/0',
        context: this,
        type: 'GET',
        data: {
          FormName: '_' + objectType + '_',
          ObjectType: objectType,
          DisplayMode: 'edit'
        },
        dataType: 'json',
        success: function(resp) {
          proto.set({Name: name});
          proto.set({ID: objectType});
          proto.set({show: true});
          proto.set({obs: {
            data: resp.data,
            fieldsets: resp.fieldsets,
            schema: resp.schema
          }});
          this.collection.push(proto);
          var index = this.collection.indexOf(proto);
          this.updateProtoStatus(index);
        },
        error: function(msg) {
          console.warn('request new proto error');
        }
      });
    },

  });
});
