exports.BOOKING_STATUS = {
    SI_RECEIVED: 'SI_RECEIVED',
    OPEN: 'OPEN',
    CONFIRMED: 'CONFIRMED'
}

exports.SCHEDULE_TRIP_LIST = {
    "dataRange": {
        "departureFrom": "2022-02-22T00:00:00.000Z",
        "departureTo": "2022-02-28T23:59:59.999Z"
    },
    "requestRefNo": "29ddb8b6-eace-45b7-bdb9-ce1da1fe90b3",
    "routeGroupsList": [
        {
            "identification": {
                "dataSourceType": "SSM2014",
                "requestRefNo": "29ddb8b6-eace-45b7-bdb9-ce1da1fe90b3"
            },
            "carrier": {
                "_id": "5559fcab395a2df11f3e0ed6",
                "carrierID": 3,
                "name": "YANG MING",
                "scac": "YMLU",
                "enabled": true,
                "ssmEnabled": true,
                "url": "http://www.yangming.com/e-service/schedule/PointToPoint.aspx",
                "shortName": "YANG MING",
                "sortingKey": "yang ming",
                "updatedAt": "2021-08-18T05:05:06.879Z",
                "updatedBy": "huangde4",
                "analyticsEnabled": true,
                "ssSearchEnabled": true,
                "vsSearchEnabled": true
            },
            "por": {
                "location": {
                    "_id": "62145fc28edfe300155afed1",
                    "source": "CS4",
                    "unlocode": "CNSHA",
                    "name": "Shanghai",
                    "uc_name": "SHANGHAI",
                    "geo": [
                        121.473701,
                        31.230416
                    ],
                    "locationID": "P102",
                    "csID": 102,
                    "csCityID": 2530967,
                    "type": "PORT",
                    "fullName": "Shanghai, Shanghai, China",
                    "timezone": "Asia/Shanghai",
                    "refreshDateTime": "2022-02-22T04:00:02.781Z"
                }
            },
            "fnd": {
                "location": {
                    "_id": "62145fc28edfe300155aff33",
                    "source": "CS4",
                    "unlocode": "ESBCN",
                    "name": "Barcelona",
                    "uc_name": "BARCELONA",
                    "geo": [
                        2.173403,
                        41.385063
                    ],
                    "locationID": "P363",
                    "csID": 363,
                    "csCityID": 2532798,
                    "type": "PORT",
                    "fullName": "Barcelona, Catalunya, Spain",
                    "timezone": "Europe/Madrid",
                    "refreshDateTime": "2022-02-22T04:00:02.784Z"
                }
            },
            "route": [
                {
                    "csRouteID": 4193137683,
                    "csPointPairID": 691,
                    "carrierScac": "YMLU",
                    "por": {
                        "location": {
                            "locationID": "P102",
                            "name": "Shanghai",
                            "unlocode": "CNSHA",
                            "csID": 102,
                            "csCityId": 2530967,
                            "timezone": "Asia/Shanghai"
                        },
                        "etd": "2023-09-30T00:00:00.000Z"
                    },
                    "fnd": {
                        "location": {
                            "locationID": "P363",
                            "name": "Barcelona",
                            "unlocode": "ESBCN",
                            "csID": 363,
                            "csCityId": 2532798,
                            "timezone": "Europe/Madrid"
                        },
                        "eta": "2023-10-31T00:00:00.000Z"
                    },
                    "transitTime": 40,
                    "direct": true,
                    "importHaulage": "CY",
                    "exportHaulage": "CY",
                    "touchTime": "2022-02-22T10:24:06.000Z",
                    "leg": [
                        {
                            "fromPoint": {
                                "voyageStop": {
                                    "voyageStopId": 37063054,
                                    "skip": false
                                },
                                "location": {
                                    "locationID": "P102",
                                    "name": "Shanghai",
                                    "unlocode": "CNSHA",
                                    "csID": 102,
                                    "csCityId": 2530967,
                                    "timezone": "Asia/Shanghai",
                                    "facility": {
                                        "name": "YANGSHAN PHASE IV AUTOMATED CONTAINER TERMINAL",
                                        "code": "CNSHAP26",
                                        "id": 34641,
                                        "type": "Terminal"
                                    }
                                },
                                "defaultCutoff": "2022-02-21T00:00:00.000Z",
                                "etd": "2022-02-22T00:00:00.000Z",
                                "gmtEtd": "2022-02-21T16:00:00.000Z"
                            },
                            "toPoint": {
                                "voyageStop": {
                                    "voyageStopId": 37063063,
                                    "skip": false
                                },
                                "location": {
                                    "locationID": "P363",
                                    "name": "Barcelona",
                                    "unlocode": "ESBCN",
                                    "csID": 363,
                                    "csCityId": 2532798,
                                    "timezone": "Europe/Madrid"
                                },
                                "eta": "2022-04-03T00:00:00.000Z",
                                "gmtEta": "2022-04-02T22:00:00.000Z"
                            },
                            "transportMode": "VESSEL",
                            "service": {
                                "serviceID": 274,
                                "code": "MD2",
                                "name": "MEDITERRANEAN SERVICE-2"
                            },
                            "vessel": {
                                "vesselGID": "V000024593",
                                "name": "ZEAL LUMOS",
                                "IMO": 9864241
                            },
                            "imoNumber": 9864241,
                            "externalVoyageNumber": "003W",
                            "transitTime": 40
                        }
                    ],
                    "transportSummary": "VESSEL:274:V000024593:003W",
                    "defaultCutoff": {
                        "cutoffTime": "2022-02-21T00:00:00.000Z"
                    },
                    "isPossibleDirect": false,
                    "isUncertainTransitTime": false
                }
            ]
        }
    ]
}