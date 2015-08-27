define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'backbone_forms',
	'requirejs-text!./Templates/NsFormsModule.html',
	'listOfNestedModel',
	'./NsFormsCustomFields',
	'i18n',
], function ($, _, Backbone, Marionette, BackboneForm, tpl,ListOfNestedModel) {
	return Backbone.View.extend({
		BBForm: null,
		modelurl: null,
		Name: null,
		objecttype: null,
		displayMode: null,
		buttonRegion: null,
		formRegion: null,
		id: null,
		reloadAfterSave: true,
		template: tpl,
		redirectAfterPost: "",

		extendsBBForm: function(){
			Backbone.Form.validators.errMessages.required = '';
			Backbone.Form.Editor.prototype.initialize = function(options){
				var options = options || {};

				//Set initial value
				if (options.model) {
				  if (!options.key) throw new Error("Missing option: 'key'");

				  this.model = options.model;

				  this.value = this.model.get(options.key);
				}
				else if (options.value !== undefined) {
				  this.value = options.value;
				}

				if (this.value === undefined) this.value = this.defaultValue;

				//Store important data
				_.extend(this, _.pick(options, 'key', 'form'));

				var schema = this.schema = options.schema || {};

				this.validators = options.validators || schema.validators;

				//Main attributes
				this.$el.attr('id', this.id);
				this.$el.attr('name', this.getName());
				if (schema.editorClass) this.$el.addClass(schema.editorClass);
				if (schema.editorAttrs) this.$el.attr(schema.editorAttrs);

				if(options.schema.validators){
				  this.$el.addClass('required');
				}

			};
		},

		initialize: function (options) {
			this.extendsBBForm();

			var jqxhr;
			this.modelurl = options.modelurl;




			this.name = options.name;
			this.buttonRegion = options.buttonRegion;
			this.formRegion = options.formRegion;
			this.reloadAfterSave = options.reloadAfterSave || this.reloadAfterSave;
			// The template need formname as vrairable, to make it work if several NSForms in the same page
			// With adding formname, there will be no name conflit on Button class
			var variables = { formname: this.name };
			if (options.template) {
				// if a specific template is given, we use it
				this.template = _.template($(options.template).html(), variables);
			}
			else {
				// else use default template
				this.template = _.template($(tpl).html(), variables);
			}


			if (options.id && !isNaN(options.id)) {
				this.id = options.id;
			}
			else {
				this.id = 0;
			}

			if (options.displayMode) {
				this.displayMode = options.displayMode;
			}
			else {
				this.displayMode = 'edit';
			}
			if (options.objecttype) {
				this.objecttype = options.objecttype;
			}
			else {
				this.objecttype = null;
			}
			this.objecttype = options.objecttype;

			if (options.model) {
				this.model = options.model;
				this.BBForm = new BackboneForm({ model: this.model, fieldsets: this.model.fieldsets});
				this.showForm();
			}
			else {
				this.initModel();
			}

			if (options.redirectAfterPost) {
				// allow to redirect after creation (post) using the id of created object
				this.redirectAfterPost = options.redirectAfterPost;
			}
		},



		initModel: function (){
			var _this = this;

			if(!this.model){
				this.model = new Backbone.Model();
			}

			var url = this.modelurl +'/'+ this.id;

			//initialize model from AJAX call
			this.jqxhr = $.ajax({
				url: url,
				context: this,
				type: 'GET',
				data: { FormName: this.name, ObjectType: this.objecttype, DisplayMode: this.displayMode },
				dataType: 'json',
				success: function (resp) {
					_this.model.schema = resp.schema;
					_this.model.attributes = resp.data;
					if (resp.fieldsets) {
						// if fieldset present in response, we get it
						_this.model.fieldsets = resp.fieldsets;
					}
					// give the url to model to manage save
					_this.model.urlRoot = this.modelurl;
					_this.BBForm = new BackboneForm({ model: _this.model, data: _this.model.data, fieldsets: _this.model.fieldsets, schema: _this.model.schema });
					_this.showForm();
				},
				error: function (data) {
					//alert('error Getting Fields for Form ' + this.name + ' on type ' + this.objecttype);
				}
			});
		},

		showForm: function () {
			this.BBForm.render();
			// Call extendable function before the show call
			this.BeforeShow();
			var _this = this;
			$('#' + this.formRegion).html(this.BBForm.el);

			this.buttonRegion.forEach(function (entry) {
				$('#' + entry).html(_this.template);
				$('#' + entry).i18n();
			});

			this.displaybuttons();


			this.bindEvents();
			this.afterShow();
		},




		displaybuttons: function () {
			var name = this.name;
			console.log(this.model);
			if(this.displayMode == 'edit'){
				$('#'+this.buttonRegion[0]).find('.NsFormModuleCancel').removeClass('hidden');
				$('#'+this.buttonRegion[0]).find('.NsFormModuleSave').removeClass('hidden');
				$('#'+this.buttonRegion[0]).find('.NsFormModuleClear').removeClass('hidden');

				$('#'+this.buttonRegion[0]).find('.NsFormModuleEdit').addClass('hidden');
				$('#'+this.buttonRegion[0]).find('#' + this.formRegion).find('input:enabled:first').focus();
			}else{
				$('#'+this.buttonRegion[0]).find('.NsFormModuleCancel').addClass('hidden');
				$('#'+this.buttonRegion[0]).find('.NsFormModuleSave').addClass('hidden');
				$('#'+this.buttonRegion[0]).find('.NsFormModuleClear').addClass('hidden');

				$('#'+this.buttonRegion[0]).find('.NsFormModuleEdit').removeClass('hidden');
			}
			if(!this.model.attributes.id){
				$('#'+this.buttonRegion[0]).find('.NsFormModuleCancel').addClass('hidden');
			}

		},

		afterShow: function(){
			//this.$el.i18n();
		},


		butClickSave: function (e) {
			var errors = this.BBForm.commit();
			var jqhrx;

			this.model.on('sync', function(){
				console.log('request');
			});

			if(!errors){
					if (this.model.attributes["id"] == 0) {
						// To force post when model.save()
					this.model.attributes["id"] = null;
				}
				var _this = this;
				this.onSavingModel();
				if (this.model.id == 0) {
					// New Record
					jqhrx = this.model.save(null, {
						success: function (model, response) {
							// Getting ID of created record, from the model (has beeen affected during model.save in the response)
							_this.savingSuccess(model, response);
							_this.id = _this.model.id;
							
							if (_this.redirectAfterPost != "") {
								// If redirect after creation
								var TargetUrl = _this.redirectAfterPost.replace('@id', _this.id);

								if (window.location.href == window.location.origin + TargetUrl) {
									// if same page, relaod
									window.location.reload();
								}
								else {
									// otpherwise redirect
									window.location.href = TargetUrl;
								}

							}
							else {
								// If no redirect after creation
								if (_this.reloadAfterSave) {
									_this.reloadingAfterSave();
								}
							}
							return true;
						},
						error: function (response) {
							_this.savingError(response);
							return false;
						}

					});
				}
				else {
					// After update of existing record
					this.model.id = this.model.get('id');
					var jqxhr = this.model.save(null, {
						success: function (model, response) {
							_this.savingSuccess(model, response);
							if (_this.reloadAfterSave) {
								_this.reloadingAfterSave();
							}
						},
						error: function (response) {
							_this.savingError(response);
						}
					});
					
				}
			}else{
				return false;
			}
			this.afterSavingModel();
			return jqxhr;
		},

		reloadAfterSave: function(){

		},

		butClickEdit: function (e) {
			this.displayMode = 'edit';
			this.initModel();
			this.displaybuttons();
		},
		butClickCancel: function (e) {
			this.displayMode = 'display';
			this.initModel();
			this.displaybuttons();
		},
		butClickClear: function (e) {
			var formContent = this.BBForm.el;
			$(formContent).find('input').val('');
			$(formContent).find('select').val('');
			$(formContent).find('textarea').val('');
			$(formContent).find('input[type="checkbox"]').attr('checked', false);
		},

		butClickDelete: function(){
			this.afterDelete(); 
		},


		afterDelete: function(){
			
		},


		reloadingAfterSave: function () {
			this.displayMode = 'display';
			// reaload created record from AJAX Call
			this.initModel();
			this.showForm();
			this.displaybuttons();
		},

		onSavingModel: function () {
			// To be extended, calld after commit before save on model
		},
		afterSavingModel: function () {
			// To be extended called after model.save()
		},
		BeforeShow: function () {
			// to be extended called after render, before the show function
		},

		savingSuccess: function (model, response) {
			// To be extended, called after save on model if success
		},
		savingError: function (response) {
			// To be extended, called after save on model if error
		},


		bindEvents: function(){
			var _this = this;
			var name = this.name;

			/*==========  Edit  ==========*/
			this.onEditEvt = $.proxy(function(){
				this.butClickEdit();
			}, this);

			$('#'+this.buttonRegion[0] + ' .NsFormModuleEdit').on('click', this.onEditEvt);

			/*==========  Cancel  ==========*/
			this.onCancelEvt = $.proxy(function(){
				this.butClickCancel();
			}, this);

			$('#'+this.buttonRegion[0] + ' .NsFormModuleCancel').on('click', this.onCancelEvt);

			/*==========  save  ==========*/
			this.onSaveEvt = $.proxy(function(){
				this.butClickSave();
			}, this);

			$('#'+this.buttonRegion[0] + ' .NsFormModuleSave').on('click', this.onSaveEvt);

			/*==========  Clear  ==========*/
			this.onClearEvt = $.proxy(function(){
				this.butClickClear();
			}, this);

			$('#'+this.buttonRegion[0] + ' .NsFormModuleClear').on('click', this.onClearEvt);

			/*==========  Delete  ==========*/
			this.onDeleteEvt = $.proxy(function(){
				this.butClickDelete();
			}, this);

			$('#'+this.buttonRegion[0] + ' .NsFormModuleDelete').on('click', this.onDeleteEvt);
		},


		unbind: function(){
			var _this = this;
			var name = this.name;

			$('#'+this.buttonRegion[0] + ' .NsFormModuleDelete').off('click', this.onEditEvt);
			$('#'+this.buttonRegion[0] + ' .NsFormModuleDelete').off('click', this.onCancelEvt);
			$('#'+this.buttonRegion[0] + ' .NsFormModuleDelete').off('click', this.onSaveEvt);
			$('#'+this.buttonRegion[0] + ' .NsFormModuleDelete').off('click', this.onClearEvt);
			$('#'+this.buttonRegion[0] + ' .NsFormModuleDelete').off('click', this.onDeleteEvt);
		},

		destroy: function(){
			this.unbind();
		}
	});

});
