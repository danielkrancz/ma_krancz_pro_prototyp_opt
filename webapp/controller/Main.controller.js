sap.ui.define([
    "at/hb/makrancz/procodeappopt/controller/BaseController",
    'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
    "sap/ui/model/json/JSONModel",
    'sap/ui/comp/smartvariants/PersonalizableInfo',
    'sap/m/Token'
], (Controller, Filter, FilterOperator, JSONModel, PersonalizableInfo, Token) => {
    "use strict";

    return Controller.extend("at.hb.makrancz.procodeappopt.controller.Main", {
        onInit() {
            this._uiModel = new JSONModel({
                usePopin: false,
                itemSelected: false,
				supportMultiselect: true,
				supportRanges: true
            });
            this.getView().setModel(this._uiModel, "ui");
            this._registerForP13n("travelTable");

            this.applyData = this.applyData.bind(this);
			this.fetchData = this.fetchData.bind(this);
			this.getFiltersWithValues = this.getFiltersWithValues.bind(this);

			this.oSmartVariantManagement = this.getView().byId("svm");
			this.oExpandedLabel = this.getView().byId("expandedLabel");
			this.oSnappedLabel = this.getView().byId("snappedLabel");
			this.oFilterBar = this.getView().byId("filterbar");
			this.oTable = this.byId('travelTable');

			this.oFilterBar.registerFetchData(this.fetchData);
			this.oFilterBar.registerApplyData(this.applyData);
			this.oFilterBar.registerGetFiltersWithValues(this.getFiltersWithValues);

			var oPersInfo = new PersonalizableInfo({
				type: "filterBar",
				keyName: "persistencyKey",
				dataSource: "",
				control: this.oFilterBar
			});

			this.oSmartVariantManagement.addPersonalizableControl(oPersInfo);
			this.oSmartVariantManagement.initialise(function () {}, this.oFilterBar);

			var fnValidator = function(args){
				var text = args.text;

				return new Token({key: text, text: text});
			};

			this.getView().byId("inputCustomerFilter").addValidator(fnValidator);
			this.getView().byId("inputAgencyFilter").addValidator(fnValidator);
        },

        onSearch: function () {
			var aTableFilters = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
				var oControl = oFilterGroupItem.getControl(),
                    aSelectedKeys = [],
                    aFilters = [];

                if(oControl.getId().includes("OverallStatus")){
                    aSelectedKeys = oControl.getSelectedKeys();
                }else{
                    oControl.getTokens().forEach((oToken) => {
                        aSelectedKeys.push(oToken.getKey());
                    });
                }
				
					aFilters = aSelectedKeys.map(function (sSelectedKey) {
						return new Filter({
							path: oFilterGroupItem.getName(),
							operator: FilterOperator.Contains,
							value1: sSelectedKey
						});
					});

				if (aSelectedKeys.length > 0) {
					aResult.push(new Filter({
						filters: aFilters,
						and: false
					}));
				}

				return aResult;
			}, []);

			this.oTable.getBinding("items").filter(aTableFilters);
			this.oTable.setShowOverlay(false);

            if(this.oTable.getBinding("items").isSuspended()){
                this.oTable.getBinding("items").resume();
            }
		},

        fetchData: function () {
			var aData = this.oFilterBar.getAllFilterItems().reduce(function (aResult, oFilterItem) {
				aResult.push({
					groupName: oFilterItem.getGroupName(),
					fieldName: oFilterItem.getName(),
					fieldData: oFilterItem.getControl().getSelectedKeys()
				});

				return aResult;
			}, []);

			return aData;
		},

		applyData: function (aData) {
			aData.forEach(function (oDataObject) {
				var oControl = this.oFilterBar.determineControlByName(oDataObject.fieldName, oDataObject.groupName);
				oControl.setSelectedKeys(oDataObject.fieldData);
			}, this);
		},

		getFiltersWithValues: function () {
			var aFiltersWithValue = this.oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
				var oControl = oFilterGroupItem.getControl();

				if (oControl && oControl.getSelectedKeys && oControl.getSelectedKeys().length > 0) {
					aResult.push(oFilterGroupItem);
				}

				return aResult;
			}, []);

			return aFiltersWithValue;
		},

		onSelectionChange: function (oEvent) {
			this.oSmartVariantManagement.currentVariantSetModified(true);
			this.oFilterBar.fireFilterChange(oEvent);
		},

        onFilterChange: function () {
			this._updateLabelsAndTable();
		},

		onAfterVariantLoad: function () {
			this._updateLabelsAndTable();
		},

		getFormattedSummaryText: function() {
			var aFiltersWithValues = this.oFilterBar.retrieveFiltersWithValues();

			if (aFiltersWithValues.length === 0) {
				return "No filters active";
			}

			if (aFiltersWithValues.length === 1) {
				return aFiltersWithValues.length + " filter active: " + aFiltersWithValues.join(", ");
			}

			return aFiltersWithValues.length + " filters active: " + aFiltersWithValues.join(", ");
		},

		getFormattedSummaryTextExpanded: function() {
			var aFiltersWithValues = this.oFilterBar.retrieveFiltersWithValues();

			if (aFiltersWithValues.length === 0) {
				return "No filters active";
			}

			var sText = aFiltersWithValues.length + " filters active",
				aNonVisibleFiltersWithValues = this.oFilterBar.retrieveNonVisibleFiltersWithValues();

			if (aFiltersWithValues.length === 1) {
				sText = aFiltersWithValues.length + " filter active";
			}

			if (aNonVisibleFiltersWithValues && aNonVisibleFiltersWithValues.length > 0) {
				sText += " (" + aNonVisibleFiltersWithValues.length + " hidden)";
			}

			return sText;
		},

		_updateLabelsAndTable: function () {
			this.oExpandedLabel.setText(this.getFormattedSummaryTextExpanded());
			this.oSnappedLabel.setText(this.getFormattedSummaryText());
			this.oTable.setShowOverlay(true);
		},

        onPopinSelectionChanged: function(oEvent) {
            let bSelected = oEvent.getSource().getSelectedKey();
            this._uiModel.setProperty("/usePopin", bSelected === 'X' ? true : false);
        },

        onTableSelectionChanged: function(oEvent) {
            this._uiModel.setProperty("/itemSelected", true);
        },

        onListItemPressed: function(oEvent) {
            let sTravelId = oEvent.getSource().getBindingContext().getObject().TravelID;
            this.getRouter().navTo("Detail", {
                TravelID: sTravelId
            }, false)
        },

		onCreatePressed: function() {
			this.getRouter().navTo("Detail", {
				TravelID: "-"
			}, true)
		},

		onCopyPressed: function() {
			let selectedItem = this.getView().byId("travelTable").getSelectedItem().getBindingContext();
            this.getModel().callFunction("/copyTravel", {
				urlParameters: {
					TravelID: selectedItem.getObject().TravelID
				},
				method: "POST",
				success: (oReturn) => {
					debugger;
					this.getRouter().navTo("Detail", {
						TravelID: oReturn.TravelID
					}, false)
				}
			})
			
		},

        onDeleteItem: function() {
            let selectedItem = this.getView().byId("travelTable").getSelectedItem().getBindingContext();
            MessageBox.confirm("Delete object " + selectedItem.getObject().TravelID, {
                actions: ["Delete", "Cancel"],
                emphasizedAction: "Delete",
                initialFocus: "Cancel",
                onClose: (sAction) => {
                    if(sAction === "Delete"){
                        this.getView().setBusy(true);
                        this.getModel().remove(selectedItem.getPath(), {
                            success: () => {
                                this.getView().setBusy(false);
                                this.getView().byId("travelTable").getBinding("items").refresh();
                                MessageToast.show("Object was deleted.");
                            },
                            error: () => {
                                this.getView().setBusy(false);
                            }
                        });
                    }
                }
            });
        }

    });
});