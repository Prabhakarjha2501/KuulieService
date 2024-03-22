const tnt = {
    "obj": {
        "bill_of_lading": {
            "actual_delivery_time": null,
            "actual_receipt_time": null,
            "bl_no": "215641766",
            "carrier_no": "MAEU",
            "cbm": null,
            "cntr_no": "MNBU1033194",
            "created": "2022-01-07T12:58:45.748497+00:00",
            "id": "87893131-f3bf-479a-87ad-d4d47e7d5e31",
            "kgs": null,
            "place_of_delivery": "SAJED",
            "place_of_delivery_name": "JEDDAH",
            "place_of_receipt": "KEMBA",
            "place_of_receipt_name": "MOMBASA",
            "pod": "SAJED",
            "pod_actual_arrival_lt": null,
            "pod_actual_arrival_utc": null,
            "pod_actual_departure_lt": null,
            "pod_actual_discharge_lt": null,
            "pod_name": "JEDDAH",
            "pod_predicted_arrival_lt": "2022-01-22T20:07:09.399052+03:00",
            "pod_predicted_arrival_utc": "2022-01-22T17:07:09.399052+00:00",
            "pod_predicted_departure_lt": "2022-01-23T14:24:05.557594+03:00",
            "pod_predicted_discharge_lt": "2022-01-22T15:00:00+03:00",
            "pod_scheduled_arrival_lt": "2022-01-22T15:00:00+03:00",
            "pod_scheduled_departure_lt": "2022-01-23T06:00:00+03:00",
            "pod_scheduled_discharge_lt": "2022-01-22T15:00:00+03:00",
            "pol": "KEMBA",
            "pol_actual_arrival_lt": null,
            "pol_actual_departure_lt": "2022-01-07T13:23:00+03:00",
            "pol_actual_loading_lt": "2022-01-07T13:23:00+03:00",
            "pol_name": "MOMBASA",
            "pol_predicted_arrival_lt": "2022-01-27T01:01:37.333333+03:00",
            "pol_predicted_departure_lt": null,
            "pol_predicted_loading_lt": null,
            "pol_scheduled_arrival_lt": "2022-01-04T15:00:00+03:00",
            "pol_scheduled_departure_lt": null,
            "pol_scheduled_loading_lt": null,
            "scheduled_delivery_time": null,
            "scheduled_receipt_time": null,
            "updated": "2022-01-08T06:31:59.750606+00:00"
        },
        "bill_of_lading_bookmark": {
            "bl_no": "215641766",
            "carrier_no": "MAEU",
            "cntr_no": "MNBU1033194",
            "created": "2022-01-07T12:58:40.378138+00:00",
            "customer_id": null,
            "customer_no": null,
            "id": "83dffe9b-230a-4248-94bf-46cb7cb59dff",
            "org_id": "495b1943-41d1-528d-b5fb-166aff2548f0",
            "status": "SUCCESS",
            "status_code": "0",
            "updated": "2022-01-20T14:34:01.781589+00:00",
            "voyage_no": null
        },
        "container_event_list": [
            {
                "created": "2022-01-20T14:34:01.471734+00:00",
                "event_raw": "Gate in",
                "event_time": "2022-01-04T15:59:00",
                "event_time_estimated": null,
                "event_type_code": "GATEIN",
                "event_type_name": "Gate in",
                "id": "d6b75329-df79-4ef2-9bd1-078f4635610a",
                "location_raw": "Mombasa",
                "location_type_code": "POL",
                "location_type_name": "Port of loading",
                "port_code": "KEMBA",
                "port_name": "MOMBASA",
                "updated": "2022-01-20T14:34:01.471758+00:00"
            },
            {
                "created": "2022-01-20T14:34:01.471789+00:00",
                "event_raw": "Load",
                "event_time": "2022-01-07T13:23:00",
                "event_time_estimated": null,
                "event_type_code": "LOAD",
                "event_type_name": "Loaded onto vessel",
                "id": "28323d88-2bcb-4207-9e73-b979def93097",
                "location_raw": "Mombasa",
                "location_type_code": "POL",
                "location_type_name": "Port of loading",
                "port_code": "KEMBA",
                "port_name": "MOMBASA",
                "updated": "2022-01-20T14:34:01.471800+00:00"
            },
            {
                "created": "2022-01-20T14:34:01.471827+00:00",
                "event_raw": "Discharge",
                "event_time": "2022-01-12T12:44:00",
                "event_time_estimated": null,
                "event_type_code": "UNLOAD",
                "event_type_name": "Unload from vessel",
                "id": "52fceb31-8483-48f3-98d9-d7064eb0384b",
                "location_raw": "Salalah",
                "location_type_code": "POT",
                "location_type_name": "Port of transhipment",
                "port_code": "OMSLL",
                "port_name": "SALALAH",
                "updated": "2022-01-20T14:34:01.471837+00:00"
            },
            {
                "created": "2022-01-20T14:34:01.471863+00:00",
                "event_raw": "Load",
                "event_time": "2022-01-18T05:26:00",
                "event_time_estimated": null,
                "event_type_code": "LOAD",
                "event_type_name": "Loaded onto vessel",
                "id": "226477d1-cc8c-4cd8-bf28-ae3854467679",
                "location_raw": "Salalah",
                "location_type_code": "POT",
                "location_type_name": "Port of transhipment",
                "port_code": "OMSLL",
                "port_name": "SALALAH",
                "updated": "2022-01-20T14:34:01.471873+00:00"
            },
            {
                "created": "2022-01-20T14:34:01.471898+00:00",
                "event_raw": "Discharge",
                "event_time": null,
                "event_time_estimated": "2022-01-22T15:00:00",
                "event_type_code": "UNLOAD",
                "event_type_name": "Unload from vessel",
                "id": "1dad94c7-4530-472c-b6d4-b9169f68dc7a",
                "location_raw": "Jeddah",
                "location_type_code": "POD",
                "location_type_name": "Port of discharge",
                "port_code": "SAJED",
                "port_name": "JEDDAH",
                "updated": "2022-01-20T14:34:01.471908+00:00"
            },
            {
                "created": "2022-01-20T14:34:01.471934+00:00",
                "event_raw": "Gate out",
                "event_time": null,
                "event_time_estimated": "2022-01-22T15:00:06",
                "event_type_code": "GATEOUT",
                "event_type_name": "Gate out",
                "id": "e69373a3-6c0c-4cfe-9393-38fdab425e79",
                "location_raw": "Jeddah",
                "location_type_code": "POD",
                "location_type_name": "Port of discharge",
                "port_code": "SAJED",
                "port_name": "JEDDAH",
                "updated": "2022-01-20T14:34:01.471944+00:00"
            }
        ],
        "container_meta_info": {},
        "id": "83dffe9b-230a-4248-94bf-46cb7cb59dff",
        "msg": "Obtained latest bill of lading and container tracking information",
        "org_id": "495b1943-41d1-528d-b5fb-166aff2548f0",
        "sailing_info_tracking": [
            {
                "actual_arrival_lt": null,
                "actual_arrival_utc": null,
                "ais": {
                    "course": 73.3,
                    "draught_m": null,
                    "imo": "9313943",
                    "lat": -3.96423,
                    "lon": 40.12706,
                    "speed_nm": 22.1,
                    "status": "UNDER WAY USING ENGINE",
                    "timestamp_utc": "2022-01-08T13:38:09+00:00"
                },
                "cancelled": false,
                "predicted_arrival_lt": null,
                "predicted_arrival_utc": null,
                "prediction_confidence_level": null,
                "prediction_time_utc": null,
                "sailing_info": {
                    "carrier_no": "MAEU",
                    "created": "2022-01-20T14:34:01.332720+00:00",
                    "id": "b5622a5b-8ead-4b04-830c-3abb0b7d5034",
                    "imo": "9313943",
                    "is_active": true,
                    "pod": "OMSLL",
                    "pod_actual_arrival_lt": "2022-01-12T12:44:00+04:00",
                    "pod_actual_departure_lt": null,
                    "pod_actual_discharge_lt": "2022-01-12T12:44:00+04:00",
                    "pod_name": "SALALAH",
                    "pod_predicted_arrival_lt": null,
                    "pod_predicted_departure_lt": "2022-01-12T17:00:00+04:00",
                    "pod_predicted_discharge_lt": null,
                    "pod_scheduled_arrival_lt": null,
                    "pod_scheduled_departure_lt": "2022-01-12T17:00:00+04:00",
                    "pod_scheduled_discharge_lt": null,
                    "pol": "KEMBA",
                    "pol_actual_arrival_lt": null,
                    "pol_actual_departure": null,
                    "pol_actual_departure_lt": "2022-01-07T13:23:00+03:00",
                    "pol_actual_loading_lt": "2022-01-07T13:23:00+03:00",
                    "pol_name": "MOMBASA",
                    "pol_predicted_arrival_lt": "2022-01-27T01:01:37.333333+03:00",
                    "pol_predicted_departure_lt": null,
                    "pol_predicted_loading_lt": null,
                    "pol_scheduled_arrival_lt": "2022-01-04T15:00:00+03:00",
                    "pol_scheduled_departure_lt": null,
                    "pol_scheduled_loading_lt": null,
                    "status": "DEPARTED_FROM_TARGET_PORT",
                    "status_code": "5",
                    "updated": "2022-01-20T14:59:25.076344+00:00",
                    "vessel_leg": 0,
                    "vessel_name": "SEAGO ISTANBUL",
                    "voyage_no": "201N"
                },
                "scheduled_arrival_lt": "2022-01-12T03:30:00+04:00",
                "scheduled_arrival_utc": "2022-01-11T23:30:00+00:00",
                "target_port_code": "OMSLL",
                "target_port_name": "SALALAH",
                "voyage_details": [
                    {
                        "active_scac": "MAEU",
                        "actual_arrival_lt": null,
                        "actual_arrival_utc": null,
                        "actual_departure_lt": null,
                        "actual_departure_utc": null,
                        "id": "caeda00b-d2b8-4fdd-bd43-b8f8c8558119",
                        "index": 1,
                        "lat": -4.0475,
                        "lon": 39.635,
                        "original_voyage_no": "201N",
                        "port_code": "KEMBA",
                        "port_name": "MOMBASA",
                        "predicted_arrival_lt": "2022-01-27T01:01:37.333333+03:00",
                        "predicted_arrival_utc": "2022-01-26T22:01:37.333333+00:00",
                        "predicted_departure_lt": "2022-01-07T01:00:00+03:00",
                        "predicted_departure_utc": "2022-01-06T21:00:00+00:00",
                        "prediction_time_utc": "2022-01-08T14:48:07.496576+00:00",
                        "scheduled_arrival_lt": "2022-01-04T15:00:00+03:00",
                        "scheduled_arrival_on_time_confidence": null,
                        "scheduled_arrival_utc": "2022-01-04T12:00:00+00:00",
                        "scheduled_departure_lt": "2022-01-07T01:00:00+03:00",
                        "scheduled_departure_on_time_confidence": null,
                        "scheduled_departure_utc": "2022-01-06T22:00:00+00:00",
                        "timezone": "UTC +3",
                        "voyage_no_list": [
                            "201N",
                            "150S"
                        ]
                    },
                    {
                        "active_scac": "MAEU",
                        "actual_arrival_lt": null,
                        "actual_arrival_utc": null,
                        "actual_departure_lt": null,
                        "actual_departure_utc": null,
                        "id": "f21fc76f-4a47-414f-92ea-b06f870876c6",
                        "index": 2,
                        "lat": 16.953125,
                        "lon": 54.00435,
                        "original_voyage_no": "201N",
                        "port_code": "OMSLL",
                        "port_name": "SALALAH",
                        "predicted_arrival_lt": "2022-01-12T03:30:00+04:00",
                        "predicted_arrival_utc": "2022-01-11T23:30:00+00:00",
                        "predicted_departure_lt": "2022-01-12T17:00:00+04:00",
                        "predicted_departure_utc": "2022-01-12T13:00:00+00:00",
                        "prediction_time_utc": null,
                        "scheduled_arrival_lt": "2022-01-12T03:30:00+04:00",
                        "scheduled_arrival_on_time_confidence": null,
                        "scheduled_arrival_utc": "2022-01-11T23:30:00+00:00",
                        "scheduled_departure_lt": "2022-01-12T17:00:00+04:00",
                        "scheduled_departure_on_time_confidence": null,
                        "scheduled_departure_utc": "2022-01-12T13:00:00+00:00",
                        "timezone": "UTC +4",
                        "voyage_no_list": [
                            "201N"
                        ]
                    }
                ],
                "voyage_no_list": [
                    "150S",
                    "201N"
                ]
            },
            {
                "actual_arrival_lt": null,
                "actual_arrival_utc": null,
                "ais": {
                    "course": 334.8,
                    "draught_m": null,
                    "imo": "9713375",
                    "lat": 13.08597,
                    "lon": 43.14025,
                    "speed_nm": 15.2,
                    "status": "UNDER WAY USING ENGINE",
                    "timestamp_utc": "2022-01-20T20:50:14+00:00"
                },
                "cancelled": false,
                "predicted_arrival_lt": "2022-01-22T20:07:09.399052+03:00",
                "predicted_arrival_utc": "2022-01-22T17:07:09.399052+00:00",
                "prediction_confidence_level": null,
                "prediction_time_utc": "2022-01-20T21:20:16.408017+00:00",
                "sailing_info": {
                    "carrier_no": "MAEU",
                    "created": "2022-01-20T14:34:01.333762+00:00",
                    "id": "c1fd5e37-7c86-4c97-a6bf-49b2b5ae988a",
                    "imo": "9713375",
                    "is_active": true,
                    "pod": "SAJED",
                    "pod_actual_arrival_lt": null,
                    "pod_actual_departure_lt": null,
                    "pod_actual_discharge_lt": null,
                    "pod_name": "JEDDAH",
                    "pod_predicted_arrival_lt": "2022-01-22T20:07:09.399052+03:00",
                    "pod_predicted_departure_lt": "2022-01-23T14:24:05.557594+03:00",
                    "pod_predicted_discharge_lt": "2022-01-22T15:00:00+03:00",
                    "pod_scheduled_arrival_lt": "2022-01-22T15:00:00+03:00",
                    "pod_scheduled_departure_lt": "2022-01-23T06:00:00+03:00",
                    "pod_scheduled_discharge_lt": "2022-01-22T15:00:00+03:00",
                    "pol": "OMSLL",
                    "pol_actual_arrival_lt": null,
                    "pol_actual_departure": null,
                    "pol_actual_departure_lt": "2022-01-18T05:26:00+04:00",
                    "pol_actual_loading_lt": "2022-01-18T05:26:00+04:00",
                    "pol_name": "SALALAH",
                    "pol_predicted_arrival_lt": "2022-01-17T20:30:00+04:00",
                    "pol_predicted_departure_lt": null,
                    "pol_predicted_loading_lt": null,
                    "pol_scheduled_arrival_lt": "2022-01-17T20:30:00+04:00",
                    "pol_scheduled_departure_lt": null,
                    "pol_scheduled_loading_lt": null,
                    "status": "SUCCESS",
                    "status_code": "0",
                    "updated": "2022-01-20T21:20:52.936247+00:00",
                    "vessel_leg": 1,
                    "vessel_name": "MAERSK GUATEMALA",
                    "voyage_no": "201W"
                },
                "scheduled_arrival_lt": "2022-01-22T15:00:00+03:00",
                "scheduled_arrival_utc": "2022-01-22T12:00:00+00:00",
                "target_port_code": "SAJED",
                "target_port_name": "JEDDAH",
                "voyage_details": [
                    {
                        "active_scac": "MAEU",
                        "actual_arrival_lt": null,
                        "actual_arrival_utc": null,
                        "actual_departure_lt": null,
                        "actual_departure_utc": null,
                        "id": "e3bf3d0d-2fba-4103-98b2-698c47004c82",
                        "index": 1,
                        "lat": 16.953125,
                        "lon": 54.00435,
                        "original_voyage_no": "201W",
                        "port_code": "OMSLL",
                        "port_name": "SALALAH",
                        "predicted_arrival_lt": "2022-01-17T20:30:00+04:00",
                        "predicted_arrival_utc": "2022-01-17T16:30:00+00:00",
                        "predicted_departure_lt": "2022-01-18T17:30:00+04:00",
                        "predicted_departure_utc": "2022-01-18T13:30:00+00:00",
                        "prediction_time_utc": null,
                        "scheduled_arrival_lt": "2022-01-17T20:30:00+04:00",
                        "scheduled_arrival_on_time_confidence": null,
                        "scheduled_arrival_utc": "2022-01-17T16:30:00+00:00",
                        "scheduled_departure_lt": "2022-01-18T17:30:00+04:00",
                        "scheduled_departure_on_time_confidence": null,
                        "scheduled_departure_utc": "2022-01-18T13:30:00+00:00",
                        "timezone": "UTC +4",
                        "voyage_no_list": [
                            "201W"
                        ]
                    },
                    {
                        "active_scac": "MAEU",
                        "actual_arrival_lt": null,
                        "actual_arrival_utc": null,
                        "actual_departure_lt": null,
                        "actual_departure_utc": null,
                        "id": "c2989c96-9d6f-4cbc-a545-9b19fd2a7cdf",
                        "index": 2,
                        "lat": 21.48182,
                        "lon": 39.147125,
                        "original_voyage_no": "201W",
                        "port_code": "SAJED",
                        "port_name": "JEDDAH",
                        "predicted_arrival_lt": "2022-01-22T15:00:00+03:00",
                        "predicted_arrival_utc": "2022-01-22T12:00:00+00:00",
                        "predicted_departure_lt": "2022-01-23T05:00:00+03:00",
                        "predicted_departure_utc": "2022-01-23T02:00:00+00:00",
                        "prediction_time_utc": null,
                        "scheduled_arrival_lt": "2022-01-22T15:00:00+03:00",
                        "scheduled_arrival_on_time_confidence": null,
                        "scheduled_arrival_utc": "2022-01-22T12:00:00+00:00",
                        "scheduled_departure_lt": "2022-01-23T05:00:00+03:00",
                        "scheduled_departure_on_time_confidence": null,
                        "scheduled_departure_utc": "2022-01-23T02:00:00+00:00",
                        "timezone": "UTC +3",
                        "voyage_no_list": [
                            "201W"
                        ]
                    },
                    {
                        "active_scac": "MAEU",
                        "actual_arrival_lt": null,
                        "actual_arrival_utc": null,
                        "actual_departure_lt": null,
                        "actual_departure_utc": null,
                        "id": "01806d17-837b-4254-b5b1-1a55250584a1",
                        "index": 3,
                        "lat": 30.494735,
                        "lon": 32.344675,
                        "original_voyage_no": "201W",
                        "port_code": "EGSUZ",
                        "port_name": "SUEZ CANAL",
                        "predicted_arrival_lt": "2022-01-24T23:00:00+02:00",
                        "predicted_arrival_utc": "2022-01-24T21:00:00+00:00",
                        "predicted_departure_lt": "2022-01-25T15:00:00+02:00",
                        "predicted_departure_utc": "2022-01-25T13:00:00+00:00",
                        "prediction_time_utc": null,
                        "scheduled_arrival_lt": "2022-01-24T23:00:00+02:00",
                        "scheduled_arrival_on_time_confidence": null,
                        "scheduled_arrival_utc": "2022-01-24T21:00:00+00:00",
                        "scheduled_departure_lt": "2022-01-25T15:00:00+02:00",
                        "scheduled_departure_on_time_confidence": null,
                        "scheduled_departure_utc": "2022-01-25T13:00:00+00:00",
                        "timezone": "UTC +2",
                        "voyage_no_list": [
                            "201W"
                        ]
                    },
                    {
                        "active_scac": "MAEU",
                        "actual_arrival_lt": null,
                        "actual_arrival_utc": null,
                        "actual_departure_lt": null,
                        "actual_departure_utc": null,
                        "id": "93534a78-66d4-4b7e-bdd5-bcbaa39fc3e7",
                        "index": 4,
                        "lat": 31.24478,
                        "lon": 32.323,
                        "original_voyage_no": "201W",
                        "port_code": "EGPSD",
                        "port_name": "PORT SAID",
                        "predicted_arrival_lt": "2022-01-25T17:00:00+02:00",
                        "predicted_arrival_utc": "2022-01-25T15:00:00+00:00",
                        "predicted_departure_lt": "2022-01-26T22:00:00+02:00",
                        "predicted_departure_utc": "2022-01-26T20:00:00+00:00",
                        "prediction_time_utc": null,
                        "scheduled_arrival_lt": "2022-01-25T17:00:00+02:00",
                        "scheduled_arrival_on_time_confidence": null,
                        "scheduled_arrival_utc": "2022-01-25T15:00:00+00:00",
                        "scheduled_departure_lt": "2022-01-26T22:00:00+02:00",
                        "scheduled_departure_on_time_confidence": null,
                        "scheduled_departure_utc": "2022-01-26T20:00:00+00:00",
                        "timezone": "UTC +2",
                        "voyage_no_list": [
                            "201W"
                        ]
                    },
                ],
                "voyage_no_list": [
                    "201W",
                    "205E",
                    "208W"
                ]
            }
        ],
        "success": true
    }
};

const scheduled = {
    "dataRange": {
        "departureFrom": "2022-02-19T00:00:00.000Z",
        "departureTo": "2022-03-04T23:59:59.999Z"
    },
    "requestRefNo": "864ee301-8a41-4f39-9223-a28aef7b30c3",
    "routeGroupsList": [
        {
            "identification": {
                "dataSourceType": "SSM2014",
                "requestRefNo": "864ee301-8a41-4f39-9223-a28aef7b30c3"
            },
            "carrier": {
                "_id": "557ab159395a5b8cdab49527",
                "carrierID": 7,
                "name": "EVERGREEN",
                "scac": "EGLV",
                "shortName": "EVERGREEN",
                "url": "http://www.shipmentlink.com/tvs2/jsp/TVS2_InteractiveSchedule.jsp",
                "enabled": true,
                "ssmEnabled": true,
                "sortingKey": "evergreenline",
                "updatedAt": "2021-08-18T05:03:18.959Z",
                "updatedBy": "huangde4",
                "analyticsEnabled": true,
                "ssSearchEnabled": true,
                "vsSearchEnabled": true
            },
            "por": {
                "location": {
                    "_id": "62106b438edfe3001554cc5c",
                    "source": "CS4",
                    "unlocode": "CNQDG",
                    "name": "Qingdao",
                    "uc_name": "Qingdao",
                    "geo": [

                        120.3830,
                        36.0662
                    ],
                    "locationID": "P102",
                    "csID": 102,
                    "csCityID": 2530967,
                    "type": "PORT",
                    "fullName": "QING DAO,QIANWAN,CNTAO,CN TAO.",
                    "timezone": "Asia/Qingdao",
                    "refreshDateTime": "2022-02-19T04:00:03.035Z"
                }
            },
            "fnd": {
                "location": {
                    "_id": "62106b438edfe3001554ccbe",
                    "source": "CS4",
                    "unlocode": "US LAX",
                    "name": "Los Angeles",
                    "uc_name": "The Port of Los Angeles",
                    "geo": [
                        118.2816,
                        33.7406

                    ],
                    "locationID": "P363",
                    "csID": 363,
                    "csCityID": 2532798,
                    "type": "PORT",
                    "fullName": "The Port of Los Angeles",
                    "timezone": "California/USA",
                    "refreshDateTime": "2022-02-19T04:00:03.036Z"
                }
            },
            "route": [
                {
                    "csRouteID": 3911983819,
                    "csPointPairID": 32,
                    "carrierScac": "EGLV",
                    "por": {
                        "location": {
                            "locationID": "P102",
                            "name": "Qingdao",
                            "unlocode": "CNQDG",
                            "csID": 102,
                            "csCityId": 2530967,
                            "timezone": "US/Norfolk"
                        },
                        "etd": "2022-05-19T00:00:00.000Z"
                    },
                    "fnd": {
                        "location": {
                            "locationID": "P363",
                            "name": "Norfolk",
                            "unlocode": "USORF",
                            "csID": 363,
                            "csCityId": 2532798,
                            "timezone": "Asia/Shanghai"
                        },
                        "eta": "2022-05-18T00:00:00.000Z"
                    },
                    "transitTime": 30,
                    "direct": true,
                    "touchTime": "2022-02-17T22:21:50.000Z",
                    "leg": [
                        {
                            "fromPoint": {
                                "location": {
                                    "locationID": "P102",
                                    "name": "Qingdao",
                                    "unlocode": "CNQDG",
                                    "csID": 102,
                                    "csCityId": 2530967,
                                    "timezone": "Asia/Qingdao"
                                },
                                "etd": "2022-02-28T00:00:00.000Z",
                                "gmtEtd": "2022-02-27T16:00:00.000Z"
                            },
                            "toPoint": {
                                "location": {
                                    "locationID": "P102",
                                    "name": "Qingdao",
                                    "unlocode": "CNQDG",
                                    "csID": 102,
                                    "csCityId": 2530967,
                                    "timezone": "Asia/Qingdao"
                                },
                                "eta": "2022-03-01T00:00:00.000Z",
                                "gmtEta": "2022-02-28T16:00:00.000Z"
                            },
                            "transportMode": "Zhong Gu Ji Lin",
                            "transitTime": 1
                        },
                        {
                            "fromPoint": {
                                "voyageStop": {
                                    "voyageStopId": 36502209,
                                    "skip": false
                                },
                                "location": {
                                    "locationID": "P102",
                                    "name": "Qingdao",
                                    "unlocode": "CNQDG",
                                    "csID": 102,
                                    "csCityId": 2530967,
                                    "timezone": "Asia/Qingdao"
                                },
                                "defaultCutoff": "2022-02-27T12:00:00.000Z",
                                "etd": "2022-03-01T00:00:00.000Z",
                                "gmtEtd": "2022-02-28T16:00:00.000Z"
                            },
                            "toPoint": {
                                "voyageStop": {
                                    "voyageStopId": 36502217,
                                    "skip": false
                                },
                                "location": {
                                    "locationID": "P363",
                                    "name": "Oakland",
                                    "unlocode": "US OAK",
                                    "csID": 363,
                                    "csCityId": 2532798,
                                    "timezone": "Oakland/CA/USA"
                                },
                                "eta": "2022-03-30T00:00:00.000Z",
                                "gmtEta": "2022-03-29T22:00:00.000Z"
                            },
                            "transportMode": "VESSEL",
                            "service": {
                                "serviceID": 10015260,
                                "code": "MEX1",
                                "name": "Middle East Express (SlotExchange With CMA CGM)"
                            },
                            "vessel": {
                                "vesselGID": "V000000223",
                                "name": "OOCL FRANCE",
                                "IMO": 9622617
                            },
                            "imoNumber": 9622617,
                            "externalVoyageNumber": "044W",
                            "transitTime": 29
                        }
                    ],
                    "transportSummary": "TBD/VESSEL:10015260:V000000223:044W",
                    "defaultCutoff": {},
                    "isPossibleDirect": true,
                    "isUncertainTransitTime": false
                },
                {
                    "csRouteID": 3890720238,
                    "csPointPairID": 32,
                    "carrierScac": "EGLV",
                    "por": {
                        "location": {
                            "locationID": "P102",
                            "name": "Shanghai",
                            "unlocode": "CNSHA",
                            "csID": 102,
                            "csCityId": 2530967,
                            "timezone": "Asia/Shanghai"
                        },
                        "etd": "2022-02-20T00:00:00.000Z"
                    },
                    "fnd": {
                        "location": {
                            "locationID": "P363",
                            "name": "Los Angeles",
                            "unlocode": "USTSU",
                            "csID": 363,
                            "csCityId": 2532798,
                            "timezone": "US/Los Angeles"
                        },
                        "eta": "2022-03-20T00:00:00.000Z"
                    },
                    "transitTime": 28,
                    "direct": true,
                    "touchTime": "2022-02-17T22:21:50.000Z",
                    "leg": [
                        {
                            "fromPoint": {
                                "location": {
                                    "locationID": "P102",
                                    "name": "Shanghai",
                                    "unlocode": "CNSHA",
                                    "csID": 102,
                                    "csCityId": 2530967,
                                    "timezone": "Asia/Shanghai"
                                },
                                "etd": "2022-02-20T00:00:00.000Z",
                                "gmtEtd": "2022-02-19T16:00:00.000Z"
                            },
                            "toPoint": {
                                "location": {
                                    "locationID": "P102",
                                    "name": "Shanghai",
                                    "unlocode": "CNSHA",
                                    "csID": 102,
                                    "csCityId": 2530967,
                                    "timezone": "Asia/Shanghai"
                                },
                                "eta": "2022-02-21T00:00:00.000Z",
                                "gmtEta": "2022-02-20T16:00:00.000Z"
                            },
                            "transportMode": "---",
                            "transitTime": 1
                        },
                        {
                            "fromPoint": {
                                "voyageStop": {
                                    "voyageStopId": 36423866,
                                    "skip": false
                                },
                                "location": {
                                    "locationID": "P102",
                                    "name": "Shanghai",
                                    "unlocode": "CNSHA",
                                    "csID": 102,
                                    "csCityId": 2530967,
                                    "timezone": "Asia/Shanghai"
                                },
                                "defaultCutoff": "2022-02-19T12:00:00.000Z",
                                "etd": "2022-02-21T00:00:00.000Z",
                                "gmtEtd": "2022-02-20T16:00:00.000Z"
                            },
                            "toPoint": {
                                "voyageStop": {
                                    "voyageStopId": 36423874,
                                    "skip": false
                                },
                                "location": {
                                    "locationID": "P363",
                                    "name": "Oakland",
                                    "unlocode": "USOAK",
                                    "csID": 363,
                                    "csCityId": 2532798,
                                    "timezone": "US/Los Angeles"
                                },
                                "eta": "2022-03-20T00:00:00.000Z",
                                "gmtEta": "2022-03-19T23:00:00.000Z"
                            },
                            "transportMode": "VESSEL",
                            "service": {
                                "serviceID": 10015260,
                                "code": "MEX1",
                                "name": "Middle East Express (SlotExchange With CMA CGM)"
                            },
                            "vessel": {
                                "vesselGID": "V000024898",
                                "name": "CMA CGM SCANDOLA",
                                "IMO": 9859129
                            },
                            "imoNumber": 9859129,
                            "externalVoyageNumber": "0MEBDW1MA",
                            "transitTime": 27
                        }
                    ],
                    "transportSummary": "TBD/VESSEL:10015260:V000024898:0MEBDW1MA",
                    "defaultCutoff": {},
                    "isPossibleDirect": true,
                    "isUncertainTransitTime": false
                }
            ]
        },
        {
            "identification": {
                "dataSourceType": "SSM2014",
                "requestRefNo": "864ee301-8a41-4f39-9223-a28aef7b30c3"
            },
            "carrier": {
                "_id": "557ab159395a5b8cdab49529",
                "carrierID": 8,
                "name": "MAERSK",
                "scac": "MAEU",
                "shortName": "MAERSK",
                "url": "http://my.maerskline.com/schedules",
                "enabled": true,
                "ssmEnabled": true,
                "sortingKey": "maersk",
                "updatedAt": "2021-08-18T05:04:05.579Z",
                "updatedBy": "huangde4",
                "analyticsEnabled": true,
                "ssSearchEnabled": true,
                "vsSearchEnabled": true
            },
            "por": {
                "location": {
                    "_id": "62106b438edfe3001554cc5c",
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
                    "refreshDateTime": "2022-02-19T04:00:03.035Z"
                }
            },
            "fnd": {
                "location": {
                    "_id": "62106b438edfe3001554ccbe",
                    "source": "CS4",
                    "unlocode": "ESBCN",
                    "name": "Houston",
                    "uc_name": "Houston",
                    "geo": [
                        95.2724,
                        29.7300
                    ],
                    "locationID": "P363",
                    "csID": 363,
                    "csCityID": 2532798,
                    "type": "PORT",
                    "fullName": "Port of Houston Authority (POHA)",
                    "timezone": "US/Houston",
                    "refreshDateTime": "2022-05-19T04:00:03.036Z"
                }
            },
            "route": [
                {
                    "csRouteID": 4133930232,
                    "csPointPairID": 9243,
                    "carrierScac": "MAEU",
                    "por": {
                        "location": {
                            "locationID": "P102",
                            "name": "Shanghai",
                            "unlocode": "CNSHA",
                            "csID": 102,
                            "csCityId": 2530967,
                            "timezone": "Asia/Shanghai"
                        },
                        "etd": "2022-05-21T08:00:00.000Z"
                    },
                    "fnd": {
                        "location": {
                            "locationID": "P363",
                            "name": "Houston",
                            "unlocode": "USHOU",
                            "csID": 363,
                            "csCityId": 2532798,
                            "timezone": "US/Houston"
                        },
                        "eta": "2022-05-20T14:00:00.000Z"
                    },
                    "transitTime": 45,
                    "direct": true,
                    "importHaulage": "BOTH",
                    "exportHaulage": "BOTH",
                    "touchTime": "2022-02-19T08:08:11.000Z",
                    "leg": [
                        {
                            "fromPoint": {
                                "voyageStop": {
                                    "voyageStopId": 37590917,
                                    "skip": false
                                },
                                "location": {
                                    "locationID": "P102",
                                    "name": "Shanghai",
                                    "unlocode": "CNSHA",
                                    "csID": 102,
                                    "csCityId": 2530967,
                                    "timezone": "Asia/Shanghai"
                                },
                                "etd": "2022-03-01T08:00:00.000Z",
                                "gmtEtd": "2022-03-01T00:00:00.000Z"
                            },
                            "toPoint": {
                                "voyageStop": {
                                    "voyageStopId": 37590927,
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
                                "eta": "2022-04-09T14:00:00.000Z",
                                "gmtEta": "2022-04-09T12:00:00.000Z"
                            },
                            "transportMode": "VESSEL",
                            "service": {
                                "serviceID": 2660,
                                "code": "MEX1",
                                "name": "Middle East Express (SlotExchange With CMA CGM)"
                            },
                            "vessel": {
                                "vesselGID": "V000023506",
                                "name": "MSC ARINA",
                                "IMO": 9839284
                            },
                            "imoNumber": 9839284,
                            "externalVoyageNumber": "207W",
                            "transitTime": 39
                        }
                    ],
                    "transportSummary": "VESSEL:2660:V000023506:207W",
                    "defaultCutoff": {},
                    "isPossibleDirect": false,
                    "isUncertainTransitTime": false
                }
            ]
        }
    ]
};

module.exports = {
    tnt,
    scheduled
}