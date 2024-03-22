require('dotenv').config();
const logger = require('../../logger/logger');
const axios = require('axios');
const { INTERNAL_SERVER_ERROR } = require('../../utils/apiStatus');
const API_URL = process.env.SCHEDULE_API_URL;
const API_KEY = process.env.SCHEDULE_API_KEY;
const headers = {
    headers: {
        'x-api-key': API_KEY
    }
}
const { scheduled } = require('./../../../resources/dummyData');
const QueryString = require('qs');
const { getPortCode } = require('../../utils/services/shared.service');
const moment = require('moment');
const { getCache, setExpirableCache } = require('../../utils/redis-service');
const executeQuery = require('../../db/connect');

const ports = async (req, res) => {
    const { limit, offset, search, id, code, name, region_id, country_id, with_terms } = req.body;

    const url = API_URL + `locations/list?appKey=${API_KEY}&keyword=${search}`;

    await axios.get(url, headers).then((response) => {
        res.send(response.data);
    }).catch(err => {
        console.log('schedule API error', err.response.data.message);
        logger.error(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.response.data.message });
    })
}

const vessels = async (req, res) => {
    const { limit, offset, search, id, imo, call_sign, mmsi, name, carrier_id, carrier_scac, sort } = req.body;

    const url = API_URL + `vessels?limit=${limit}&offset=${offset}&search=${search}&id=${id}&imo=${imo}&call_sign=${call_sign}&mmsi=${mmsi}&name=${name}&carrier_id=${carrier_id}&carrier_scac=${carrier_scac}&sort=${sort}`

    await axios.get(url, headers).then((response) => {
        res.send(response.data)
    }).catch(err => {
        console.log('schedule API error', err.response.data.message);
        logger.error(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.response.data.message });
    })
}

const carriers = async (req, res) => {
    const { limit, offset, search, id, scac, name } = req.body;

    const url = API_URL + `carriers?limit=${limit}&offset=${offset}&search=${search}&id=${id}&scac=${scac}&name=${name}`

    await axios.get(url, headers).then((response) => {
        res.send(response.data)
    }).catch(err => {
        console.log('schedule API error', err.response.data.message);
        logger.error(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.response.data.message });
    })
}

const trips = async (req, res) => {
    const { limit, offset, origins_id, origins_code, destinations_id, destinations_code, duration_gte, duration_lte, start_date_gte,
        start_date_lte, start_date_lt, end_date_gte, end_date_lte, end_date_lt, searchDuration } = req.body;

    if (origins_id == 'dummydata' && destinations_id == 'dummydata' && searchDuration == 'dummydata') {
        res.status(200).send(scheduled);
    }
    else {
        const trips = await getTrips(req.body);
        if (trips.status === 200) {
            res.send(trips.data)
        }
        else {
            res.status(INTERNAL_SERVER_ERROR).send({ message: trips.err.response.data.message });
        }
    }
}

const getTrips = async (params) => {
    const url = API_URL + `schedules/routeschedules?appKey=${API_KEY}&porID=${params.origins_id}&fndID=${params.destinations_id}&searchDuration=${params.searchDuration}&enableNearbySchedules=true&useRealTimeData=true`;
    console.log('url', url);
    return await axios.get(url, headers).then((response) => {
        return { status: 200, data: response.data };
    }).catch(err => {
        console.log('schedule API error', err.response.data.message);
        logger.error(err);
        return { status: 500, err };
    })
}

const calls = async (req, res) => {
    const { limit, offset, schedule_id, carriers_id, carriers_scac, port_id, port_code, vessel_id, vessel_imo, sort, with_terms, carrier_kinds } = req.body;

    const url = API_URL + `calls?limit=${limit}&offset=${offset}&schedule_id=${schedule_id}&carriers_id=${carriers_id}&carriers_scac=${carriers_scac}&port_id=${port_id}&port_code=${port_code}&vessel_id=${vessel_id}&vessel_imo=${vessel_imo}&sort=${sort}&with_terms=${with_terms}&${carrier_kinds}`

    await axios.get(url, headers).then((response) => {
        res.send(response.data)
    }).catch(err => {
        console.log('schedule API error', err.response.data.message);
        logger.error(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.response.data.message });
    })
}

const locations = async (req, res) => {
    const { limit, offset, search } = req.body;

    const url = API_URL + `locations?limit=${limit}&offset=${offset}&search=${search}`

    await axios.get(url, headers).then((response) => {
        res.send(response.data)
    }).catch(err => {
        console.log('schedule API error', err.response.data.message);
        logger.error(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.response.data.message });
    })
}

const tracking = async (req, res) => {
    const { limit, offset, ports_id, ports_code, vessel_id, vessel_imo, sort, with_nearby_ports } = req.body;

    const url = API_URL + `tracking?limit=${limit}&offset=${offset}&ports_id=${ports_id}&ports_code=${ports_code}&vessel_id=${vessel_id}&vessel_imo=${vessel_imo}&sort=${sort}&with_nearby_ports=${with_nearby_ports}`

    await axios.get(url, headers).then((response) => {
        res.send(response.data)
    }).catch(err => {
        console.log('schedule API error', err.response.data.message);
        logger.error(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.response.data.message });
    })
}

const schedules = async (req, res) => {
    const { limit, offset, id, vessel_id, vessel_imo, carrier_id, carrier_scac, start_port_id, start_port_code, end_port_id, end_port_code, start_date_gte, start_date_lte, start_date_lt, end_date_gte, end_date_lte, end_date_lt } = req.body;

    const url = API_URL + `schedules?limit=${limit}&offset=${offset}&id=${id}&vessel_id=${vessel_id}&vessel_imo=${vessel_imo}&carrier_id=${carrier_id}&carrier_scac=${carrier_scac}&start_port_id=${start_port_id}&start_port_code=${start_port_code}&end_port_id=${end_port_id}&end_port_code=${end_port_code}&start_date.gte=${start_date_gte}&start_date.lte=${start_date_lte}&start_date.lt=${start_date_lt}&end_date.gte=${end_date_gte}&end_date.lte=${end_date_lte}&end_date.lt=${end_date_lt}&with_terms=&carrier_kinds=`

    await axios.get(url, headers).then((response) => {
        res.send(response.data)
    }).catch(err => {
        console.log('schedule API error', err.response.data.message);
        logger.error(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err.response.data.message });
    })
}

const getPortsLocationMap = async (dbConnectionString) => {
    let portsMap = await getCache("PORTS_LOCATION_MAP");
    if (portsMap) {
        return portsMap;
    }
    const portsQuery = "SELECT DISTINCT ports, lat, lng FROM onload_quotation WHERE ports IS NOT NULL AND ports != '' AND lat IS NOT NULL AND lat != '0' AND lng IS NOT NULL AND lng != '0'";
    const portsQueryResponse = await executeQuery(portsQuery, dbConnectionString);
    portsMap = portsQueryResponse?.rows?.reduce((acc, item) => {
        const port = item.ports;
        const portCode = port?.split(", ");
        acc[portCode[2]] = {
            name: port,
            lat: item.lat,
            lng: item.lng
        }
        return acc;
    }, {});
    console.log("Created PORTS_LOCATION_MAP");
    setExpirableCache("PORTS_LOCATION_MAP", portsMap, 3600);
    return portsMap;
}

const searchSchedules = async (req, res) => {
    const { pageSize, pageNumber } = req.query;
    const { origin, destination, range, carrier, serviceCode, vesselName, voyageNumber, online, validityDateFrom, validityDateTo, cargoReadyDate } = req.body;
    try {
        const portsLocationMap = await getPortsLocationMap(req.dbConnectionString);
        const url = `${process.env.BLUEWATER_API_URL}/get/json/p2p_master`;
        const originPortCode = getPortCode(origin);
        const destinationPortCode = getPortCode(destination);

        let scheduleSearchParams;
        if (range) {
            const originEventDateStart = moment(new Date(), "MM/DD/YYYY").format('MM/DD/YYYY');
            const originEventDateEnd = moment(new Date()).add(Number(range) * 7, 'days').format('MM/DD/YYYY');
            const originEventDate = `${originEventDateStart}-${originEventDateEnd}`;
            scheduleSearchParams = {
                key: process.env.BLUEWATER_API_KEY,
                origin_port_code: originPortCode,
                destination_port_code: destinationPortCode,
                origin_eventdate: originEventDate,
                datalinks: '["p2p_segments", "vessels"]',
                sort: "origin_eventdate",
                limit: pageSize,
                offset: (pageNumber - 1) * pageSize,
            }
        } else {
            scheduleSearchParams = {
                key: process.env.BLUEWATER_API_KEY,
                origin_port_code: originPortCode,
                destination_port_code: destinationPortCode,
                datalinks: '["p2p_segments", "vessels"]',
                sort: "origin_eventdate",
                scac_code: carrier,
                carrier_service_des: !!serviceCode ? serviceCode : undefined,
                vessel_name: !!vesselName ? vesselName : undefined,
                voyage: !!voyageNumber ? voyageNumber : undefined,
            }
            if (!online) {
                const originEventDateStart = moment(cargoReadyDate).format('MM/DD/YYYY');
                const originEventDateEnd = moment(validityDateTo).format('MM/DD/YYYY');
                const originEventDate = `${originEventDateStart}-${originEventDateEnd}`;
                scheduleSearchParams.origin_eventdate = originEventDate;
            }
        }
        const response = await axios.get(url, {
            params: scheduleSearchParams,
            paramsSerializer: params => {
                return QueryString.stringify(params)
            }
        });

        let pagination = {};
        let data = [];
        const responseData = response.data?.length > 0 ? response.data[0] : {};
        const { HEADER, DATA } = responseData;

        if (HEADER) {
            pagination = {
                total: HEADER.RECORDS_RETURNED,
                pageSize,
                pageNumber,
            }
        }

        if (DATA) {
            for (let i = 0; i < DATA.length; i++) {
                const item = DATA[i];
                const routeDetail = (item.P2P_SEGMENTS?.DATA || [])
                    .sort((a, b) => a.SEGMENT_SEQUENCE - b.SEGMENT_SEQUENCE)
                    .map(item => ({
                        origin: `${item.SEGMENT_ORIGIN}, ${item.SEGMENT_ORIGIN_PORT_CODE}`,
                        destination: `${item.SEGMENT_DESTINATION}, ${item.SEGMENT_DESTINATION_PORT_CODE}`,
                        originEventDate: moment(item.SEGMENT_ORIGIN_EVENT_EDD, "MM/DD/YYYY").format('MM/DD/YYYY'),
                        destinationEventDate: moment(item.SEGMENT_DESTINATION_EVENT_EAD, "MM/DD/YYYY").format('MM/DD/YYYY'),
                        transitTime: item.SEGMENT_TRANSIT_TIME,
                        originPortDetail: portsLocationMap[item.SEGMENT_ORIGIN_PORT_CODE],
                        destinationPortDetail: portsLocationMap[item.SEGMENT_DESTINATION_PORT_CODE],
                    }));
                if (item.AMENDMENT_CODE != 'D') {
                    data.push({
                        id: item.P2P_ID,
                        origin,
                        destination,
                        vesselName: item.VESSEL_NAME,
                        vesselImo: item.VESSEL_IMO,
                        voyage: item.VOYAGE,
                        voyageId: item.VOYAGE_ID,
                        carrier: item.SCAC_CODE,
                        carrierAlias: item.CARRIER_ALIAS,
                        etd: item.ORIGIN_EVENTDATE,
                        eta: item.DESTINATION_EVENTDATE,
                        transitTime: item.TRANSIT_TIME,
                        delayOffsetDays: item.DELAY_OFFSET_DAYS,
                        originActualEventDate: item.ORIGIN_ACTUAL_EVENTDATE,
                        destinationActualEventDate: item.DESTINATION_ACTUAL_EVENTDATE,
                        originPortCode: item.ORIGIN_PORT_CODE,
                        originPortName: item.ORIGIN_PORT_NAME,
                        destinationPortCode: item.DESTINATION_PORT_CODE,
                        destinationPortName: item.DESTINATION_PORT_NAME,
                        serviceCode: item.CARRIER_SERVICE_DES,
                        routing: item.ROUTING,
                        routeDetail,
                    });
                }
            }
        }


        res.send({ data, pagination });
    } catch (err) {
        console.log('schedule API error', err);
        logger.error(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const getScheduleRoute = async (req, res) => {
    try {
        const { vesselImo, etd, eta, carrier, voyage } = req.body;
        const url = `${process.env.BLUEWATER_API_URL}/get/json/voyageschedules`;
        const eventStartDate = moment(etd, "MM/DD/YYYY").format('MM/DD/YYYY');
        const eventEndDate = moment(eta, "MM/DD/YYYY").format('MM/DD/YYYY');
        const response = await axios.get(url, {
            params: {
                key: process.env.BLUEWATER_API_KEY,
                vesselcode: vesselImo,
                vesselvoyagenumber: voyage,
                locationtypecode: '["L","D"]',
                eventdate: `${eventStartDate}-${eventEndDate}`,
                carriercode: carrier,
                sort: "eventdate",
                voyage_status: '["A"]'
            },
            paramsSerializer: params => {
                return QueryString.stringify(params)
            }
        });
        const getPortEvent = (LOCATIONTYPECODE) => {
            if (LOCATIONTYPECODE === 'L') {
                return 'Load';
            }
            else if (LOCATIONTYPECODE === 'D') {
                return 'Discharge';
            }
        }
        const responseData = response.data?.length > 0 ? response.data[0] : {};
        const data = responseData.DATA.map(item => {
            return {
                ...item,
                EVENT: getPortEvent(item.LOCATIONTYPECODE)
            }
        });
        res.send({ data });
    } catch (err) {
        console.log('schedule Route API error', err);
        logger.error(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

module.exports = {
    ports,
    vessels,
    carriers,
    trips,
    calls,
    locations,
    tracking,
    schedules,
    getTrips,
    searchSchedules,
    getScheduleRoute
};