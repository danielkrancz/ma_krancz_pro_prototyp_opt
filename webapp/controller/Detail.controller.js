sap.ui.define([
    "at/hb/makrancz/procodeappopt/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], (Controller, JSONModel, Fragment, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("at.hb.makrancz.procodeappopt.controller.Detail", {

        aForm: {},

        onInit: function () {
            this._oModel = new JSONModel({
                createMode: false,
                editMode: false
            });
            this.getView().setModel(this._oModel, "ui");
            this.getRouter().getRoute("Detail").attachPatternMatched(this._onPatternMatched, this);
        },

        _onPatternMatched: function (oEvent) {
            let sTravelID = oEvent.getParameters().arguments.TravelID;
            if (sTravelID !== "-") {
                this._oModel.setProperty("/createMode", false);
                this.path = `/Travel('${sTravelID}')`;
                this.getView().bindElement(this.path);
                this.loadFragment("Display");
            } else {
                this._oModel.setProperty("/createMode", true);
                this.oCreatedContext = this.getModel().createEntry("/Travel", {
                    TravelID: "-"
                });
                this.getView().bindElement(this.oCreatedContext.getPath());
                this.loadFragment("Edit");
            }
        },

        loadFragment: function (sFragment) {
            this.getView().byId("ObjectPageLayout").removeAllSections();
            this._addFormSync(sFragment + "Form").then(() => {
                if (!this._oModel.getProperty("/createMode")) {
                    this._addFormSync(sFragment + "BookingTable").then(() => {
                        this._registerForP13n("bookingTable");
                    });
                }
            });
        },

        _addFormSync: function (sFragment) {
            return new Promise((resolve, reject) => {
                if (!this.aForm[sFragment]) {
                    Fragment.load({
                        id: this.getView().getId(),
                        name: `at.hb.makrancz.procodeappopt.view.fragment.${sFragment}`,
                        controller: this
                    }).then(function (oForm) {
                        this.getView().addDependent(oForm);
                        this.aForm[sFragment] = oForm;
                        this.getView().byId("ObjectPageLayout").addSection(oForm);
                        resolve();
                    }.bind(this));
                } else {
                    this.getView().byId("ObjectPageLayout").addSection(this.aForm[sFragment]);
                    resolve();
                }
            });
        },

        onEdit: function () {
            this._oModel.setProperty("/editMode", true);
            this.loadFragment("Edit");
        },

        onSave: function () {
            this.getModel().submitChanges({
                success: () => {
                    MessageToast.show("Successfully saved.");
                    if (this._oModel.getProperty("/createMode")) {
                        this.getRouter().navTo("Detail", {
                            TravelID: this.oCreatedContext.getObject().TravelID
                        });
                        this._oModel.setProperty("/createMode", false)
                        this.loadFragment("Display");
                    } else {
                        this._oModel.setProperty("/editMode", false);
                        this.loadFragment("Display");
                    }
                }
            });
        },

        onCancel: function () {
            MessageBox.warning("Your entries will be lost when you leave this page.", {
                actions: ["Leave Page", "Cancel"],
                emphasizedAction: "Leave Page",
                initialFocus: "Cancel",
                onClose: (sAction) => {
                    if (sAction === "Leave Page") {
                        this.getModel().resetChanges({
                            success: () => {
                                if (this.getView().getModel("ui").getProperty("/createMode")) {
                                    this.onNavBack();
                                } else {
                                    this._oModel.setProperty("/editMode", false);
                                    this.loadFragment("Display");
                                }
                            }
                        });
                    }
                }
            });
        },

        onDelete: function () {
            MessageBox.warning(`Delete object ${this.getView().getElementBinding().getBoundContext().getObject().TravelID}?`, {
                actions: ["Delete", "Cancel"],
                emphasizedAction: "Delete",
                initialFocus: "Cancel",
                onClose: (sAction) => {
                    if (sAction === "Delete") {
                        this.getModel().remove(this.getView().getElementBinding().getPath(), {
                            success: () => {
                                this.onNavBack();
                            }
                        });
                    }
                }
            });
        },

        onSearchChanged: function(oEvent) {
            let oList = this.byId(this._oModel.getProperty("/editMode") ? "1bookingTable" :  "bookingTable"),
                oBindingInfo = oList.getBindingInfo("items");

            if (!oBindingInfo.parameters) {
                oBindingInfo.parameters = {};
            }
            if (!oBindingInfo.parameters.custom) {
                oBindingInfo.parameters.custom = {};
            }
            oBindingInfo.parameters.custom.search = oEvent.getParameters().value;
            oList.bindItems(oBindingInfo);
        },

        onListItemPressed: function(oEvent){
            let oObject = oEvent.getSource().getBindingContext().getObject();
			this.getRouter().navTo("BookingDetail", {
				TravelID: oObject.TravelID,
				BookingID: oObject.BookingID
			});
        },

        onCreateBooking: function(){
            let oObject = this.getView().getElementBinding().getBoundContext().getObject();
			this.getRouter().navTo("BookingDetail", {
				TravelID: oObject.TravelID,
				BookingID: "-"
			});
        }
    });
});