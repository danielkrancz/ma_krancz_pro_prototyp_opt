sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    'sap/ui/export/Spreadsheet',
    'sap/ui/export/library',
    'sap/ui/comp/valuehelpdialog/ValueHelpDialog',
    'sap/ui/table/Column',
    'sap/m/Column',
    'sap/m/Label',
    "sap/ui/comp/filterbar/FilterBar",
    "sap/ui/comp/filterbar/FilterGroupItem",
    "sap/m/Input",
    'sap/m/p13n/Engine',
    'sap/m/p13n/SelectionController',
    'sap/m/p13n/SortController',
    'sap/m/p13n/GroupController',
    'sap/m/p13n/MetadataHelper',
    'sap/m/table/ColumnWidthController',
    'sap/ui/core/library',
    "sap/ui/model/Sorter",
    "sap/m/ColumnListItem",
    "sap/m/Text"
],
    function (Controller, History, Spreadsheet, exportLibrary, ValueHelpDialog, UIColumn, MColumn, Label, FilterBar, FilterGroupItem, Input, Engine, SelectionController, SortController, GroupController, MetadataHelper, ColumnWidthController, coreLibrary, Sorter, ColumnListItem, Text) {
        "use strict";

        var EdmType = exportLibrary.EdmType;

        return Controller.extend("at.hb.makrancz.procodeappopt.controller.BaseController", {
            _sContentDensityClass: "",

            getLocalizedText: function (sId, aParams) {
                let oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                return oBundle.getText(sId, aParams);
            },

            getModel: function (sName) {
                return this.getView().getModel(sName);
            },

            setModel: function (oModel, sName) {
                return this.getView().setModel(oModel, sName);
            },

            _getKey: function (oControl) {
                return this.getView().getLocalId(oControl.getId());
            },

            _getContentDensity: function () {
                if (!this._sContentDensityClass) {
                    if (sap.ui.Device.support.touch) {
                        this._sContentDensityClass = "sapUiSizeCozy";
                    } else {
                        this._sContentDensityClass = "sapUiSizeCompact";
                    }
                }

                return this._sContentDensityClass;
            },

            setContentDensity: function () {
                this.getView().addStyleClass(this._getContentDensity());
            },

            getRouter: function () {
                return this.getOwnerComponent().getRouter();
            },

            onNavBack: function () {
                var oHistory = History.getInstance();
                var sPreviousHash = oHistory.getPreviousHash();

                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                } else {
                    var oRouter = this.getOwnerComponent().getRouter();
                    oRouter.navTo("Main", {}, true);
                }
            },

            onExport: function (oEvent, sTableId) {
                if (!this.oTable) {
                    this.oTable = this.byId(sTableId);
                }

                let aCols, oSettings, oSheet, sFileName, oTable = this.oTable, oRowBinding = oTable.getBinding('items');

                aCols = this.getExcelColumnCofing(sTableId);
                sFileName = this.getExcelFileName(sTableId);

                oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: 'Level'
                    },
                    dataSource: oRowBinding,
                    fileName: sFileName,
                    worker: false
                };

                oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(function () {
                    oSheet.destroy();
                });
            },

            getExcelFileName: function (sTableId) {
                switch (sTableId) {
                    case "travelTable":
                        return "Travels.xlsx";
                    case "bookingTable":
                        return "Bookings.xlsx";
                    case "supplementTable":
                        return "Supplements.xlsx";
                }
            },

            getExcelColumnCofing: function (sTableId) {
                switch (sTableId) {
                    case "travelTable":
                        return [{ label: 'Travel ID', property: 'TravelID', type: EdmType.String }, { label: 'Agency ID', property: ['AgencyID', 'AgencyName'], type: EdmType.String, template: '{1} ({0})' }, { label: 'Customer ID', property: ['CustomerID', 'CustomerName'], type: EdmType.String, template: '{1} ({0})' }, { label: 'Starting Date', property: 'BeginDate', type: EdmType.Date }, { label: 'End Date', property: 'EndDate', type: EdmType.Date }, { label: 'Overall Status', property: 'OverallStatusText', type: EdmType.String }, { label: 'Total Price', type: EdmType.Number, property: 'TotalPrice', scale: 2 }];
                    case "bookingTable":
                        return [{ label: 'Booking Number', property: 'BookingID', type: EdmType.String }, { label: 'Booking Date', property: 'BookingDate', type: EdmType.Date }, { label: 'Customer ID', property: ['CustomerID', 'CustomerName'], type: EdmType.String, template: '{1} ({0})' }, { label: 'Airline ID', property: ['CarrierID', 'CarrierName'], type: EdmType.String, template: '{1} ({0})' }, { label: 'Flight', property: 'ConnectionID', type: EdmType.String }, { label: 'Flight Date', property: 'FlightDate', type: EdmType.Date }, { label: 'Flight Price', type: EdmType.Number, property: 'FlightPrice', scale: 2 }, { label: 'Booking Status', property: 'BookingStatusText', type: EdmType.String }];
                    case "supplementTable":
                        return [{ label: 'Supplement ID', property: 'SupplementID', type: EdmType.String }, { label: 'Booking Date', property: 'BookingDate', type: EdmType.Date }, { label: 'Customer ID', property: ['CustomerID', 'CustomerName'], type: EdmType.String, template: '{1} ({0})' }, { label: 'Airline ID', property: ['CarrierID', 'CarrierName'], type: EdmType.String, template: '{1} ({0})' }, { label: 'Flight', property: 'ConnectionID', type: EdmType.String }, { label: 'Flight Date', property: 'FlightDate', type: EdmType.Date }, { label: 'Flight Price', type: EdmType.Number, property: 'FlightPrice', scale: 2 }, { label: 'Booking Status', property: 'BookingStatusText', type: EdmType.String }];
                }
            },

            showValueHelpDialog: function (oEvent, sEntity, bSupportRanges, bSupportMultiselect) {
                this.oSource = oEvent.getSource();
                this.bSupportMultiselect = bSupportMultiselect;
                this.bFlight = false;
                let sTitle, sKey, sDescriptionKey, sPath;

                switch (sEntity) {
                    case "Agency":
                        sTitle = "Agency ID";
                        sKey = "AgencyID";
                        sDescriptionKey = "AgencyName";
                        sPath = "/TravelAgency";
                        break;
                    case "Customer":
                        sTitle = "Customer ID";
                        sKey = "CustomerID";
                        sDescriptionKey = "LastName";
                        sPath = "/Passenger";
                        break;
                    case "Currency":
                        sTitle = "Currency Code";
                        sKey = "Currency";
                        sDescriptionKey = "Currency_Text";
                        sPath = "/Currency";
                        break;
                    case "Flight":
                        sTitle = "Flight";
                        sKey = "Flight";
                        sDescriptionKey = "Flight";
                        sPath = "/Flight";
                        this.sBookingPath = oEvent.getSource().getBindingContext().getPath();
                        this.bFlight = true;
                        break;
                    case "Product":
                        sTitle = "Supplement";
                        sKey = "SupplementID";
                        sDescriptionKey = "SupplementID";
                        sPath = "/Supplement";
                        break;
                };

                let oFilterBar = new FilterBar({
                    filterGroupItems: this.getVHFilterGroupItems(sEntity)
                });

                this._oVHD = new ValueHelpDialog({
                    title: sTitle,
                    key: sKey,
                    descriptionKey: sDescriptionKey,
                    supportRanges: bSupportRanges,
                    supportMultiselect: bSupportMultiselect,
                    ok: this.onValueHelpOkPress.bind(this),
                    cancel: this.onValueHelpCancelPress.bind(this),
                    afterClose: this.onValueHelpAfterClose.bind(this),
                    filterBar: oFilterBar
                });

                this.getView().addDependent(this._oVHD);
                oFilterBar.setFilterBarExpanded(false);

                this._oVHD.getTableAsync().then(function (oTable) {

                    if (oTable.bindRows) {
                        oTable.bindAggregation("rows", {
                            path: sPath,
                            events: {
                                dataReceived: () => {
                                    this._oVHD.update();
                                }
                            }
                        });

                        this.getVHUIColumns(sEntity).forEach((oColumn) => {
                            oTable.addColumn(oColumn);
                        });

                    }

                    if (oTable.bindItems) {
                        oTable.bindAggregation("items", {
                            path: sPath,
                            template: new ColumnListItem({
                                cells: this.getVHCells(sEntity)
                            }),
                            events: {
                                dataReceived: () => {
                                    this._oVHD.update();
                                }
                            }
                        });
                        this.getVHMColumns(sEntity).forEach((oColumn) => {
                            oTable.addColumn(oColumn);
                        });
                    }
                    this._oVHD.update();
                }.bind(this));

                this._oVHD.open();
            },

            getVHUIColumns: function (sEntity) {
                switch (sEntity) {
                    case "Agency":
                        return [new UIColumn({ label: new Label({ text: "Agency ID" }), template: new Text({ wrapping: false, text: "{AgencyID}" }) }), new UIColumn({ label: new Label({ text: "Agency Name" }), template: new Text({ wrapping: false, text: "{AgencyName}" }) }), new UIColumn({ label: new Label({ text: "Street" }), template: new Text({ wrapping: false, text: "{Street}" }) }), new UIColumn({ label: new Label({ text: "Postal Code" }), template: new Text({ wrapping: false, text: "{PostalCode}" }) }), new UIColumn({ label: new Label({ text: "City" }), template: new Text({ wrapping: false, text: "{City}" }) }), new UIColumn({ label: new Label({ text: "Country Code" }), template: new Text({ wrapping: false, text: "{CountryCode}" }) }), new UIColumn({ label: new Label({ text: "Phone" }), template: new Text({ wrapping: false, text: "{PhoneNumber}" }) }), new UIColumn({ label: new Label({ text: "Email" }), template: new Text({ wrapping: false, text: "{EMailAddress}" }) }), new UIColumn({ label: new Label({ text: "Website" }), template: new Text({ wrapping: false, text: "{WebAddress}" }) })];
                    case "Customer":
                        return [new UIColumn({ label: new Label({ text: "Customer ID" }), template: new Text({ wrapping: false, text: "{CustomerID}" }) }), new UIColumn({ label: new Label({ text: "First Name" }), template: new Text({ wrapping: false, text: "{FirstName}" }) }), new UIColumn({ label: new Label({ text: "Last Name" }), template: new Text({ wrapping: false, text: "{LastName}" }) }), new UIColumn({ label: new Label({ text: "Title" }), template: new Text({ wrapping: false, text: "{Title}" }) }), new UIColumn({ label: new Label({ text: "Street" }), template: new Text({ wrapping: false, text: "{Street}" }) })]
                    case "Currency":
                        return [new UIColumn({ label: new Label({ text: "Currency" }), template: new Text({ wrapping: false, text: "{Currency}" }) }), new UIColumn({ label: new Label({ text: "Description" }), template: new Text({ wrapping: false, text: "{Currency_Text}" }) })]
                    case "Flight":
                        return [new UIColumn({ label: new Label({ text: "Airline ID" }), template: new Text({ wrapping: false, text: "{AirlineID}" }) }), new UIColumn({ label: new Label({ text: "Flight Number" }), template: new Text({ wrapping: false, text: "{ConnectionID}" }) }), new UIColumn({ label: new Label({ text: "Flight Date" }), template: new Text({ wrapping: false, text: "{FlightDate}" }) }), new UIColumn({ label: new Label({ text: "Flight Price" }), template: new Text({ wrapping: false, text: "{Price}" }) }), new UIColumn({ label: new Label({ text: "Plane Type" }), template: new Text({ wrapping: false, text: "{PlaneType}" }) }), new UIColumn({ label: new Label({ text: "Maximum Seats" }), template: new Text({ wrapping: false, text: "{MaximumSeats}" }) }), new UIColumn({ label: new Label({ text: "Occupied Seats" }), template: new Text({ wrapping: false, text: "{Occupied Seats}" }) })];
                    case "Product":
                        return [new UIColumn({ label: new Label({ text: "Supplement ID" }), template: new Text({ wrapping: false, text: "{SupplementID}" }) }), new UIColumn({ label: new Label({ text: "SupplementCategory" }), template: new Text({ wrapping: false, text: "{SupplementCategory}" }) }), new UIColumn({ label: new Label({ text: "Price" }), template: new Text({ wrapping: false, text: "{Price}" }) })];
                }
            },

            getVHCells: function (sEntity) {
                switch (sEntity) {
                    case "Agency":
                        return [new Label({ text: "{AgencyID}" }), new Label({ text: "{AgencyName}" }), new Label({ text: "{Street}" }), new Label({ text: "{PostalCode}" }), new Label({ text: "{City}" }), new Label({ text: "{CountryCode}" }), new Label({ text: "{PhoneNumber}" }), new Label({ text: "{EMailAddress}" }), new Label({ text: "{WebAddress}" })];
                    case "Customer":
                        return [new Label({ text: "{CustomerID}" }), new Label({ text: "{FirstName}" }), new Label({ text: "{LastName}" }), new Label({ text: "{Title}" }), new Label({ text: "{Street}" })];
                    case "Currency":
                        return [new Label({ text: "{Currency}" }), new Label({ text: "{Currency_Text}" })];
                    case "Flight":
                        return [new Label({ text: "{AirlineID}" }), new Label({ text: "{ConnectionID}" }), new Label({ text: "{FlightDate}" }), new Label({ text: "{Price}" }), new Label({ text: "{PlaneType}" }), new Label({ text: "{MaximumSeats}" }), new Label({ text: "{OccupiedSeats}" })];
                    case "Product":
                        return [new Label({ text: "{SupplementID}" }), new Label({ text: "{SupplementCategory}" }), new Label({ text: "{Price}" })];
                }
            },

            getVHMColumns: function (sEntity) {
                switch (sEntity) {
                    case "Agency":
                        return [new MColumn({ header: new Label({ text: "Agency ID" }) }), new MColumn({ header: new Label({ text: "Agency Name" }) }), new MColumn({ header: new Label({ text: "Steet" }) }), new MColumn({ header: new Label({ text: "Postal Code" }) }), new MColumn({ header: new Label({ text: "City" }) }), new MColumn({ header: new Label({ text: "Country" }) }), new MColumn({ header: new Label({ text: "Phone" }) }), new MColumn({ header: new Label({ text: "Email" }) }), new MColumn({ header: new Label({ text: "Website" }) })];
                    case "Customer":
                        return [new MColumn({ header: new Label({ text: "Customer ID" }) }), new MColumn({ header: new Label({ text: "First Name" }) }), new MColumn({ header: new Label({ text: "Last Name" }) }), new MColumn({ header: new Label({ text: "Title" }) }), new MColumn({ header: new Label({ text: "Steet" }) })];
                    case "Currency":
                        return [new MColumn({ header: new Label({ text: "Currency" }) }), new MColumn({ header: new Label({ text: "Description" }) })];
                    case "Flight":
                        return [new MColumn({ header: new Label({ text: "Airline ID" }) }), new MColumn({ header: new Label({ text: "Flight Number" }) }), new MColumn({ header: new Label({ text: "Flight Date" }) }), new MColumn({ header: new Label({ text: "Price" }) }), new MColumn({ header: new Label({ text: "Plane Type" }) }), new MColumn({ header: new Label({ text: "Maximum Seats" }) }), new MColumn({ header: new Label({ text: "Occupied Seats" }) })];
                    case "Product":
                        return [new MColumn({ header: new Label({ text: "SupplementID" }) }), new MColumn({ header: new Label({ text: "SupplementCategory" }) }), new MColumn({ header: new Label({ text: "Price" }) })];
                }
            },

            onValueHelpOkPress: function (oEvent) {
                if (this.bFlight) {
                    oEvent.getSource().getTableAsync().then((oTable) => {
                        let oObject = oTable.getContextByIndex(oTable.getSelectedIndices()[0]).getObject();
                        this.getView().getModel().setProperty(this.sBookingPath + "/CarrierID", oObject.AirlineID);
                        this.getView().getModel().setProperty(this.sBookingPath + "/ConnectionID", oObject.ConnectionID);
                        this.getView().getModel().setProperty(this.sBookingPath + "/FlightDate", oObject.FlightDate);
                        this.getView().getModel().setProperty(this.sBookingPath + "/FlightPrice", oObject.Price);
                        this.getView().getModel().setProperty(this.sBookingPath + "/CurrencyCode", oObject.CurrencyCode);
                    })
                } else if (this.bSupportMultiselect) {
                    var aTokens = oEvent.getParameter("tokens");
                    this.oSource.setTokens(aTokens);
                } else {
                    this.oSource.setValue(oEvent.getParameters().tokens[0].getKey());
                }

                this._oVHD.close();
            },

            getVHFilterGroupItems: function (sEntity) {
                switch (sEntity) {
                    case "Agency":
                        return [
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "AgencyID", label: "Agency ID", visibleInFilterBar: true, control: new Input({ name: "AgencyID" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "AgencyName", label: "AgencyName", visibleInFilterBar: true, control: new Input({ name: "AgencyName" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "Street", label: "Street", visibleInFilterBar: true, control: new Input({ name: "Street" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "PostalCode", label: "PostalCode", visibleInFilterBar: true, control: new Input({ name: "PostalCode" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "City", label: "City", visibleInFilterBar: true, control: new Input({ name: "City" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "CountryCode", label: "CountryCode", visibleInFilterBar: true, control: new Input({ name: "CountryCode" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "PhoneNumber", label: "PhoneNumber", visibleInFilterBar: true, control: new Input({ name: "PhoneNumber" }) })
                        ];
                    case "Customer":
                        return [
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "CustomerID", label: "Customer ID", visibleInFilterBar: true, control: new Input({ name: "CustomerID" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "FirstName", label: "First Name", visibleInFilterBar: true, control: new Input({ name: "FirstName" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "LastName", label: "Last Name", visibleInFilterBar: true, control: new Input({ name: "LastName" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "Title", label: "Title", visibleInFilterBar: true, control: new Input({ name: "Title" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "Street", label: "Street", visibleInFilterBar: true, control: new Input({ name: "Street" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "PostalCode", label: "PostalCode", visibleInFilterBar: true, control: new Input({ name: "PostalCode" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "City", label: "City", visibleInFilterBar: true, control: new Input({ name: "City" }) })
                        ];
                    case "Currency":
                        return [
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "Currency", label: "Currency", visibleInFilterBar: true, control: new Input({ name: "Currency" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "Currency_Text", label: "Description", visibleInFilterBar: true, control: new Input({ name: "Currency_Text" }) })
                        ];
                    case "Flight":
                        return [
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "CarrierID", label: "CarrierID", visibleInFilterBar: true, control: new Input({ name: "CarrierID" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "ConnectionID", label: "ConnectionID", visibleInFilterBar: true, control: new Input({ name: "ConnectionID" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "FlightDate", label: "FlightDate", visibleInFilterBar: true, control: new Input({ name: "FlightDate" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "Price", label: "Price", visibleInFilterBar: true, control: new Input({ name: "Price" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "PlaneType", label: "PlaneType", visibleInFilterBar: true, control: new Input({ name: "PlaneType" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "MaximumSeats", label: "MaximumSeats", visibleInFilterBar: true, control: new Input({ name: "MaximumSeats" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "OccupiedSeats", label: "OccupiedSeats", visibleInFilterBar: true, control: new Input({ name: "OccupiedSeats" }) })
                        ];
                    case "Product":
                        return [
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "SupplementID", label: "SupplementID", visibleInFilterBar: true, control: new Input({ name: "SupplementID" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "SupplementCategory", label: "SupplementCategory", visibleInFilterBar: true, control: new Input({ name: "SupplementCategory" }) }),
                            new FilterGroupItem({ groupName: "__$INTERNAL$", name: "Price", label: "Price", visibleInFilterBar: true, control: new Input({ name: "Price" }) })
                        ];
                }
            },

            onValueHelpCancelPress: function () {
                this._oVHD.close();
            },

            onValueHelpAfterClose: function () {
                this._oVHD.destroy();
            },

            _registerForP13n: function (sTableId) {
                this._oTable = this.byId(sTableId);

                this.oMetadataHelper = this._getMeatadataHelper(sTableId);

                Engine.getInstance().register(this._oTable, {
                    helper: this.oMetadataHelper,
                    controller: {
                        Columns: new SelectionController({
                            targetAggregation: "columns",
                            control: this._oTable
                        }),
                        Sorter: new SortController({
                            control: this._oTable
                        }),
                        Groups: new GroupController({
                            control: this._oTable
                        }),
                        ColumnWidth: new ColumnWidthController({
                            control: this._oTable
                        })
                    }
                });

                Engine.getInstance().attachStateChange(this.handleStateChange.bind(this));
            },

            _getMeatadataHelper: function (stableId) {
                switch (stableId) {
                    case "travelTable":
                        return new MetadataHelper([
                            { key: "travelid", label: "Travel ID", path: "TravelID", cell: "{TravelID}" },
                            { key: "agencyid", label: "Agency ID", path: "AgencyID", cell: "{AgencyName} ({AgencyID})" },
                            { key: "customerid", label: "Customer ID", path: "CustomerID", cell: "{CustomerName} ({CustomerID})" },
                            { key: "begindate", label: "Starting Date", path: "BeginDate", cell: "{ path: 'BeginDate', type: 'sap.ui.model.odata.type.Date' }" },
                            { key: "enddate", label: "End Date", path: "EndDate", cell: "{ path: 'EndDate', type: 'sap.ui.model.odata.type.Date' }" },
                            { key: "status", label: "Overall Status", path: "OverallStatusText", cell: "{OverallStatusText}" },
                            { key: "totalprice", label: "Total Price", path: "TotalPrice" }
                        ]);
                    case "bookingTable":
                        return new MetadataHelper([
                            { key: "bookingid", label: "Booking Number", path: "BookingID", cell: "{TravelID}" },
                            { key: "bookingdate", label: "Booking Date", path: "BookingDate", cell: "{path: 'BookingDate', type: 'sap.ui.model.odata.type.Date'}" },
                            { key: "customerid", label: "Customer ID", path: "CustomerID", cell: "{CustomerName} ({CustomerID})" },
                            { key: "carrierid", label: "Airline ID", path: "CarrierID", cell: "{CarrierName} ({CarrierID})" },
                            { key: "connectionid", label: "Flight", path: "ConnectionID", cell: "{ConnectionID}" },
                            { key: "flightdate", label: "Flight Date", path: "FlightDate", cell: "{ path: 'FlightDate', type: 'sap.ui.model.odata.type.Date' }" },
                            { key: "flightprice", label: "Flight Price", path: "FlightPrice" },
                            { key: "status", label: "Booking Status", path: "BookingStatusText", cell: "{BookingStatusText}" }
                        ]);
                }
            },

            openPersoDialog: function (oEvt) {
                Engine.getInstance().show(this._oTable, ["Columns", "Sorter", "Groups"], {
                    contentHeight: "35rem",
                    contentWidth: "32rem",
                    source: oEvt.getSource()
                });
            },

            handleStateChange: function (oEvt) {
                var oState = oEvt.getParameter("state");

                if (!oState) {
                    return;
                }

                var aSorter = [];

                oState.Groups.forEach(function (oGroup) {
                    aSorter.push(new Sorter(this.oMetadataHelper.getProperty(oGroup.key).path, false, true));
                }.bind(this));

                oState.Sorter.forEach(function (oSorter) {
                    var oExistingSorter = aSorter.find(function (oSort) {
                        return oSort.sPath === this.oMetadataHelper.getProperty(oSorter.key).path;
                    }.bind(this));

                    if (oExistingSorter) {
                        oExistingSorter.bDescending = !!oSorter.descending;
                    } else {
                        aSorter.push(new Sorter(this.oMetadataHelper.getProperty(oSorter.key).path, oSorter.descending));
                    }
                }.bind(this));

                this._oTable.getColumns().forEach(function (oColumn, iIndex) {
                    oColumn.setVisible(false);
                    oColumn.setWidth(oState.ColumnWidth[this._getKey(oColumn)]);
                    oColumn.setSortIndicator(coreLibrary.SortOrder.None);
                    oColumn.data("grouped", false);
                }.bind(this));

                oState.Sorter.forEach(function (oSorter) {
                    var oCol = this.byId(oSorter.key);
                    if (oSorter.sorted !== false) {
                        oCol.setSortIndicator(oSorter.descending ? coreLibrary.SortOrder.Descending : coreLibrary.SortOrder.Ascending);
                    }
                }.bind(this));

                oState.Groups.forEach(function (oSorter) {
                    var oCol = this.byId(oSorter.key);
                    oCol.data("grouped", true);
                }.bind(this));

                oState.Columns.forEach(function (oProp, iIndex) {
                    var oCol = this.byId(oProp.key);
                    oCol.setVisible(true);

                    this._oTable.removeColumn(oCol);
                    this._oTable.insertColumn(oCol, iIndex);
                }.bind(this));

                var aCells = oState.Columns.map(function (oColumnState) {
                    return new Text({
                        text: this.oMetadataHelper.getProperty(oColumnState.key).cell
                    });
                }.bind(this));

                let sPath;

                switch (this._oTable.getId().split("--").pop()) {
                    case "travelTable":
                        sPath = "/Travel";
                        break;
                    case "bookingTable":
                        sPath = "to_Booking";
                        break;
                }

                this._oTable.bindItems({
                    templateShareable: false,
                    path: sPath,
                    sorter: aSorter,
                    template: new ColumnListItem({
                        type: "Navigation",
                        press: this.onListItemPressed.bind(this),
                        cells: aCells
                    })
                });

            },

            beforeOpenColumnMenu: function (oEvt) {
                var oMenu = this.byId("menu");
                var oColumn = oEvt.getParameter("openBy");
                var oSortItem = oMenu.getQuickActions()[0].getItems()[0];
                var oGroupItem = oMenu.getQuickActions()[1].getItems()[0];

                oSortItem.setKey(this._getKey(oColumn));
                oSortItem.setLabel(oColumn.getHeader().getText());
                oSortItem.setSortOrder(oColumn.getSortIndicator());

                oGroupItem.setKey(this._getKey(oColumn));
                oGroupItem.setLabel(oColumn.getHeader().getText());
                oGroupItem.setGrouped(oColumn.data("grouped"));
            },

            onColumnHeaderItemPress: function (oEvt, sTableId) {

                var oColumnHeaderItem = oEvt.getSource();
                var sPanel = "Columns";
                if (oColumnHeaderItem.getIcon().indexOf("group") >= 0) {
                    sPanel = "Groups";
                } else if (oColumnHeaderItem.getIcon().indexOf("sort") >= 0) {
                    sPanel = "Sorter";
                }

                Engine.getInstance().show(this._oTable, [sPanel], {
                    contentHeight: "35rem",
                    contentWidth: "32rem",
                    source: this._oTable
                });
            },

            onSort: function (oEvt, sTableId) {
                var oSortItem = oEvt.getParameter("item");
                var sAffectedProperty = oSortItem.getKey();
                var sSortOrder = oSortItem.getSortOrder();

                Engine.getInstance().retrieveState(this._oTable).then((oState) => {

                    oState.Sorter.forEach(function (oSorter) {
                        oSorter.sorted = false;
                    });

                    if (sSortOrder !== coreLibrary.SortOrder.None) {
                        oState.Sorter.push({
                            key: sAffectedProperty,
                            descending: sSortOrder === coreLibrary.SortOrder.Descending
                        });
                    }

                    Engine.getInstance().applyState(this._oTable, oState);
                });
            },

            onGroup: function (oEvt, sTableId) {
                var oGroupItem = oEvt.getParameter("item");
                var sAffectedProperty = oGroupItem.getKey();

                Engine.getInstance().retrieveState(this._oTable).then((oState) => {

                    oState.Groups.forEach(function (oSorter) {
                        oSorter.grouped = false;
                    });

                    if (oGroupItem.getGrouped()) {
                        oState.Groups.push({
                            key: sAffectedProperty
                        });
                    }

                    Engine.getInstance().applyState(this._oTable, oState);
                });
            },

            onColumnMove: function (oEvt, sTableId) {
                var oDraggedColumn = oEvt.getParameter("draggedControl");
                var oDroppedColumn = oEvt.getParameter("droppedControl");

                if (oDraggedColumn === oDroppedColumn) {
                    return;
                }

                var sDropPosition = oEvt.getParameter("dropPosition");
                var iDraggedIndex = this._oTable.indexOfColumn(oDraggedColumn);
                var iDroppedIndex = this._oTable.indexOfColumn(oDroppedColumn);
                var iNewPos = iDroppedIndex + (sDropPosition == "Before" ? 0 : 1) + (iDraggedIndex < iDroppedIndex ? -1 : 0);
                var sKey = this._getKey(oDraggedColumn);

                Engine.getInstance().retrieveState(this._oTable).then((oState) => {

                    var oCol = oState.Columns.find(function (oColumn) {
                        return oColumn.key === sKey;
                    }) || { key: sKey };
                    oCol.position = iNewPos;

                    Engine.getInstance().applyState(this._oTable, { Columns: [oCol] });
                });
            },

            onColumnResize: function (oEvt, sTableId) {
                var oColumn = oEvt.getParameter("column");
                var sWidth = oEvt.getParameter("width");

                var oColumnState = {};
                oColumnState[this._getKey(oColumn)] = sWidth;

                Engine.getInstance().applyState(this._oTable, {
                    ColumnWidth: oColumnState
                });
            }

        });
    });