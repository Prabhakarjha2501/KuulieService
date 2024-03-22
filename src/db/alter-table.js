require('dotenv').config();
const { Pool } = require('pg');
const { parse } = require('pg-connection-string')
const config = parse(process.env.DATABASE_URL)

config.ssl = {
  rejectUnauthorized: false
}
const pool = new Pool(config)

const query = `

ALTER TABLE customer_details ALTER COLUMN customer_id SET DEFAULT NULL;
ALTER TABLE customer_details ALTER COLUMN title   SET DEFAULT NULL;
ALTER TABLE customer_details ALTER COLUMN department   SET DEFAULT NULL;
ALTER TABLE customer_details ALTER COLUMN company_name  SET DEFAULT NULL;
ALTER TABLE customer_details ALTER COLUMN revenue   SET DEFAULT NULL;
ALTER TABLE customer_details ALTER COLUMN phone_number  SET DEFAULT NULL;
ALTER TABLE customer_details ALTER COLUMN mobile_number  SET DEFAULT NULL;
ALTER TABLE customer_details ADD IF NOT EXISTS isdelete boolean NOT NULL DEFAULT false;
ALTER TABLE customer_details ADD IF NOT EXISTS isactive boolean NOT NULL DEFAULT true;

ALTER TABLE customer_details ADD IF NOT EXISTS tier VARCHAR(100) DEFAULT NULL;
ALTER TABLE customer_details ADD IF NOT EXISTS trade_lane VARCHAR(100) DEFAULT NULL;
ALTER TABLE customer_details ADD IF NOT EXISTS region VARCHAR(100) DEFAULT NULL;
ALTER TABLE customer_details ADD IF NOT EXISTS sub_region VARCHAR(100) DEFAULT NULL;
ALTER TABLE customer_details ADD IF NOT EXISTS trade_area VARCHAR(100) DEFAULT NULL;


ALTER TABLE onload_ca ALTER COLUMN service SET DEFAULT NOT NULL;

ALTER TABLE quotation DROP COLUMN IF EXISTS container_size;
ALTER TABLE quotation DROP COLUMN IF EXISTS container_quantity;
ALTER TABLE quotation DROP COLUMN IF EXISTS container_weight;

ALTER TABLE quotation ADD IF NOT EXISTS tw_ft_container VARCHAR(100) DEFAULT NULL;
ALTER TABLE quotation ADD  IF NOT EXISTS ft_ft_container VARCHAR(100) DEFAULT NULL;
ALTER TABLE quotation ADD  IF NOT EXISTS  ft_ft_high_cube VARCHAR(100) DEFAULT NULL;
ALTER TABLE quotation ADD  IF NOT EXISTS  customer_id VARCHAR(100) DEFAULT NULL;

ALTER TABLE quotation ALTER COLUMN cargo_ready_date TYPE VARCHAR;
ALTER TABLE quotation ALTER COLUMN cargo_ready_date  SET DEFAULT NULL;

ALTER TABLE quotation_company_details ADD IF NOT EXISTS add_charges text DEFAULT NULL;
ALTER TABLE quotation_company_details ADD IF NOT EXISTS add_margin text DEFAULT NULL;


DO $$
BEGIN
  IF EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='quotation' and column_name='type')
  THEN
      ALTER TABLE quotation RENAME COLUMN "type" TO "terms";
  END IF;
END $$;

ALTER TABLE customer_details ADD IF NOT EXISTS enable_whatsapp boolean NOT NULL DEFAULT false;


ALTER TABLE my_quotations ADD IF NOT EXISTS tariff20 INTEGER NOT NULL DEFAULT 0;
ALTER TABLE my_quotations ADD IF NOT EXISTS tariff40 INTEGER NOT NULL DEFAULT 0;
ALTER TABLE my_quotations ADD IF NOT EXISTS tariff40hc INTEGER NOT NULL DEFAULT 0;

ALTER TABLE my_quotations ADD IF NOT EXISTS tier1_margin NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE my_quotations ADD IF NOT EXISTS tier2_margin  NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE my_quotations ADD IF NOT EXISTS tier3_margin  NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE my_quotations
  ALTER COLUMN tariff20 TYPE numeric;
  
  ALTER TABLE my_quotations
  ALTER COLUMN tariff40 TYPE numeric;
  
  ALTER TABLE my_quotations
  ALTER COLUMN tariff40hc TYPE numeric;

ALTER TABLE my_quotations ADD IF NOT EXISTS cargo_ready_date TIMESTAMP;
ALTER TABLE my_quotations ADD IF NOT EXISTS incoterms VARCHAR(100) DEFAULT NULL;
ALTER TABLE my_quotations ADD IF NOT EXISTS store_date TIMESTAMP;
ALTER TABLE my_quotations ADD IF NOT EXISTS commodity VARCHAR(500) DEFAULT NULL;
ALTER TABLE my_quotations ADD IF NOT EXISTS weight INTEGER NOT NULL DEFAULT 0;
ALTER TABLE my_quotations ADD IF NOT EXISTS type_of_margin VARCHAR(10) DEFAULT NULL;
ALTER TABLE my_quotations ADD IF NOT EXISTS sur_charges INTEGER NOT NULL DEFAULT 0;
ALTER TABLE my_quotations ADD IF NOT EXISTS margin INTEGER NOT NULL DEFAULT 0;
ALTER TABLE my_quotations ADD IF NOT EXISTS additional_charges_20 INTEGER NOT NULL DEFAULT 0;
ALTER TABLE my_quotations ADD IF NOT EXISTS additional_charges_40 INTEGER NOT NULL DEFAULT 0;
ALTER TABLE my_quotations ADD IF NOT EXISTS additional_charges_40HC INTEGER NOT NULL DEFAULT 0;
ALTER TABLE my_quotations ADD IF NOT EXISTS total_amount INTEGER NOT NULL DEFAULT 0;

ALTER TABLE user_details ADD IF NOT EXISTS contact_no VARCHAR(20) DEFAULT NULL;
ALTER TABLE allocation_per_customer ADD IF NOT EXISTS week INTEGER DEFAULT NULL;
ALTER TABLE "my_quotations" RENAME COLUMN "commission20ft" TO "tariff20_charges_sum";
ALTER TABLE "my_quotations" RENAME COLUMN "commission40ft" TO "tariff40_charges_sum";
ALTER TABLE "my_quotations" RENAME COLUMN "commission40hc" TO "tariff40hc_charges_sum";

ALTER TABLE ONLY allocation_planning
	ALTER COLUMN allocation_id
	SET DEFAULT TO_CHAR(nextval('alphanumeric_allocation_id_seq'::regclass),'"SD-AL-"fm000000000000');

ALTER TABLE ONLY my_quotations
	ADD IF NOT EXISTS my_quotation_id VARCHAR(500) 
  DEFAULT TO_CHAR(nextval('alphanumeric_my_quotation_id_seq'::regclass),'"SD-QU-"fm000000000000');

ALTER TABLE document ADD IF NOT EXISTS module_name VARCHAR(30) DEFAULT NULL;
ALTER TABLE document ADD IF NOT EXISTS record_id VARCHAR(100) DEFAULT NULL;

ALTER TABLE ONLY invoices 
    ADD IF NOT EXISTS alphanumeric_invoice_id VARCHAR(500)
    DEFAULT TO_CHAR(nextval('alphanumeric_invoice_id_seq'::regclass),'"SD-INV-"fm000000000000');

ALTER TABLE onload_quotation ADD IF NOT EXISTS lat VARCHAR(50) NULL;
ALTER TABLE onload_quotation ADD IF NOT EXISTS lng VARCHAR(50) NULL;

ALTER TABLE vessels ADD IF NOT EXISTS voyageNumber VARCHAR(500)
  DEFAULT TO_CHAR(nextval('voyage_number_seq'::regclass), '"SD-VYG-"fm000000000000');

ALTER TABLE vessels ADD PRIMARY KEY(id);  

ALTER TABLE ONLY voyages
  ALTER COLUMN voyage_uid
  SET DEFAULT TO_CHAR(nextval('alphanumeric_voyage_uid_seq'::regclass),'"SD-VYG-"fm000000000000')

  ALTER TABLE "voyages_ports"
RENAME COLUMN "container-pickup_city" TO "container_pickup_city";
    
    UPDATE onload_quotation
    SET lat = c.lat, lng = c.lng FROM (VALUES
    ('Abu Dhabi','24.5925','72.7083'), 
    ('Jebel Ali','25.00328','55.05206'), 
    ('Luanda','-8.8383','13.2344'), 
    ('Adelaide','31.1272','-83.4232'), 
    ('Alice Springs','30.0613','-95.383'), 
    ('Botany Bay','7.9564','-11.74'), 
    ('Brisbane','-27.4678','153.0281'), 
    ('Cairns','-16.92','145.78'), 
    ('Melbourne','46.0622','12.0798'), 
    ('Sydney','-33.865','151.2094'), 
    ('Antwerp','51.2211','4.3997'), 
    ('Bahrain','-17.5333','177.6833'), 
    ('Cotonou','6.402','2.518'), 
    ('Muara','2.05','102.56'), 
    ('Gaborone','-24.6569','25.9086'), 
    ('Vancouver','38.5019','43.4167'), 
    ('Montreal','45.5089','-73.5617'), 
    ('Prince Rupert','42.6189','-113.674'), 
    ('Halifax','44.6475','-63.5906'), 
    ('Matadi','-5.8167','13.4833'), 
    ('Abidjan','5.3364','-4.0267'), 
    ('Douala','4.05','9.7'), 
    ('Kribi','2.95','9.9167'), 
    ('Dalian','25.7003','100.1564'), 
    ('Foshan','23.0292','113.1056'), 
    ('Hangzhou','30.25','120.1675'), 
    ('Nanjing','18.7893','100.7766'), 
    ('Nansha','18.7893','100.7766'), 
    ('Ningbo','29.875','121.5492'), 
    ('Qingdao','36.1167','120.4'), 
    ('Shanghai','31.1667','121.4667'), 
    ('Tianjin','39.1467','117.2056'), 
    ('Tianjinxingang','39.1467','117.2056'), 
    ('Xiamen','24.4797','118.0819'), 
    ('Nansha New Pt','18.7893','100.7766'), 
    ('Da Chan Bay','14.1833','121.2833'), 
    ('Foshan new port','23.0292','113.1056'), 
    ('Bremerhaven','53.55','8.5833'), 
    ('Hamburg','53.55','10'), 
    ('Bremen','53.0769','8.8089'), 
    ('Djibouti','14.1012','-1.6279'), 
    ('Aalborg','57.0337','9.9166'), 
    ('Esbjerg','55.467','8.45'), 
    ('Algiers','36.7764','3.0586'), 
    ('Oran','35.6969','-0.6331'), 
    ('Alexandria','31.2','29.9167'), 
    ('Damietta','31.4167','31.8214'), 
    ('Alexandria','31.2','29.9167'), 
    ('Cairo','30.0444','31.2358'), 
    ('Suez','33.5872','130.5072'), 
    ('Port Said','31.25','32.2833'), 
    ('Algeciras','36.1275','-5.4539'), 
    ('Barcelona','42.1','19.1'), 
    ('Bilbao','43.2569','-2.9236'), 
    ('Valencia','10.1667','-68'), 
    ('Addis Ababa','5.1167','7.3667'), 
    ('Fredrikshamn (Hamina)','60.5697','27.1981'), 
    ('Helsinki','60.1756','24.9342'), 
    ('Karleby (Kokkola)','63.8376','23.132'), 
    ('Rauma (Raumo)','61.1167','21.5'), 
    ('Marseille','43.2964','5.37'), 
    ('Dunkerque','51.0383','2.3775'), 
    ('Brest','52.0847','23.6569'), 
    ('Le Havre','49.49','0.1'), 
    ('Fos-sur-Mer','47.6986','1.5078'), 
    ('Lyon','45.76','4.84'), 
    ('Libreville','0.3901','9.4544'), 
    ('Port Gentil','51.0536','3.7253'), 
    ('Liverpool','53.4075','-2.9919'), 
    ('Southampton','50.9025','-1.4042'), 
    ('Accra','5.6037','-0.187'), 
    ('Banjul','13.4531','-16.5775'), 
    ('Conakry','9.538','-13.6773'), 
    ('Piraeus','37.943','23.6469'), 
    ('Thessaloníki','40.6403','22.9356'), 
    ('Hong Kong','6.6114','0.4703'), 
    ('Bandung','-6.95','107.5667'), 
    ('Cirebon (Tjeribon)','-6.7167','108.5667'), 
    ('Jakarta','27.5492','90.7525'), 
    ('Merak','47.6986','1.5078'), 
    ('Dublin','53.3497','-6.2603'), 
    ('Haifa','32.8','34.9833'), 
    ('Ashdod','51','5.5833'), 
    ('Chennai (ex Madras)','44.6425','-121.1315'), 
    ('Kolkata (ex Calcutta)','22.5727','88.3639'), 
    ('Mumbai (ex Bombay)','19.0758','72.8775'), 
    ('Mundra','22.85','69.73'), 
    ('Nhava Sheva','19.0758','72.8775'), 
    ('Pipavav (Victor) Port','42.9894','-77.4277'), 
    ('Thiruvananthapuram (ex Trivandrum','8.5','76.8997'), 
    ('Umm Qasr','30.0342','47.9294'), 
    ('Bandar Abbas','-17.5333','177.6833'), 
    ('Bushehr','28.9667','50.8333'), 
    ('Bari','42.1','19.1'), 
    ('Cagliari','43.547','12.6473'), 
    ('Genoa','44.4072','8.934'), 
    ('Gioia Tauro','38.4333','15.9'), 
    ('La Spezia','44.108','9.8289'), 
    ('Ravenna','44.4161','12.2017'), 
    ('Civitavecchia','42.1','11.8'), 
    ('Amman','31.95','35.9333'), 
    ('Aqaba','29.5167','35'), 
    ('Tokyo','35.6839','139.7744'), 
    ('Nagoya','26.5917','127.9775'), 
    ('Nagoya','26.5917','127.9775'), 
    ('Kobe','34.6913','135.183'), 
    ('Osaka','60.2269','5.4758'), 
    ('Kitakyushu','13.0504','-9.4833'), 
    ('Tobata','34.4813','136.8434'), 
    ('Wakamatsu','10.0667','-2.5'), 
    ('Yawata','34.8756','135.7078'), 
    ('Chiba','35.6073','140.1064'), 
    ('Hakata','22.9833','94.0167'), 
    ('Kawasaki','35.5167','139.7'), 
    ('Naha','26.2122','127.6789'), 
    ('Sendai','38.2683','140.8694'), 
    ('Sendai','38.2683','140.8694'), 
    ('Shimizu','43.0111','142.8847'), 
    ('Yokkaichi','34.9667','136.6167'), 
    ('Mombasa','-4.05','39.6667'), 
    ('Nairobi','-1.2864','36.8172'), 
    ('Phnom Penh','11.5696','104.921'), 
    ('Busan','35.1','129.0403'), 
    ('Incheon','37.4639','126.6486'), 
    ('Kuwait','29.375','47.98'), 
    ('Beirut','33.8869','35.5131'), 
    ('Colombo','6.9167','79.8333'), 
    ('Monrovia','6.3106','-10.8047'), 
    ('Al Khums','32.6604','14.26'), 
    ('Tripoli','32.8752','13.1875'), 
    ('Casablanca','33.5992','-7.62'), 
    ('Antananarivo','41.0073','-8.625'), 
    ('Bamako','-17.5333','177.6833'), 
    ('Macau','22.203','113.545'), 
    ('Nouakchott','18.0858','-15.9785'), 
    ('Port Louis','-20.1667','57.5'), 
    ('Lilongwe','-13.9833','33.7833'), 
    ('Bintulu','3.17','113.03'), 
    ('Johor Bahru','1.4556','103.7611'), 
    ('Kemaman','64.95','34.6'), 
    ('Port Klang','3.0333','101.45'), 
    ('Kuantan (Tanjong Gelang)','3.8167','103.3333'), 
    ('Penang (Georgetown)','-33.9667','22.45'), 
    ('Westport/Port Klang','41.1428','-73.3475'), 
    ('Maputo','-25.9153','32.5764'), 
    ('Walvis Bay','10.0667','-2.5'), 
    ('Windhoek','-22.57','17.0836'), 
    ('Niamey','13.5086','2.1111'), 
    ('Apapa','6.4489','3.3589'), 
    ('Tincan/Lagos','6.45','3.4'), 
    ('Port Harcourt','4.75','7'), 
    ('Calabar','4.95','8.325'), 
    ('Rotterdam','51.9225','4.4792'), 
    ('Bergen','47.9675','11.3558'), 
    ('Bodø','7.9564','-11.74'), 
    ('Drammen','59.7439','10.2045'), 
    ('Haugesund','59.4102','5.2755'), 
    ('Narvik','68.4383','17.4278'), 
    ('Oslo','60.2269','5.4758'), 
    ('Stavanger','58.9701','5.7333'), 
    ('Auckland','47.4331','9.6333'), 
    ('Christchurch','-43.5309','172.6365'), 
    ('Devonport','53.3633','-113.7322'), 
    ('Dunedin','-45.8742','170.5036'), 
    ('Invercargill','-46.429','168.362'), 
    ('Napier','-39.4833','176.9167'), 
    ('Nelson','-41.2931','173.2381'), 
    ('New Plymouth','-39.0578','174.0742'), 
    ('Queenstown','40.7498','-73.7976'), 
    ('Tauranga','-37.6858','176.1667'), 
    ('Wellington','-41.2889','174.7772'), 
    ('Salalah','17.0197','54.0897'), 
    ('Batangas','1.865','9.77'), 
    ('Cebu','10.293','123.902'), 
    ('Manila','7.4004','-7.55'), 
    ('Manila North Harbour','7.4004','-7.55'), 
    ('Manila South Harbour','7.4004','-7.55'), 
    ('Subic Bay','14.9','120.2333'), 
    ('Gwadar','25.1264','62.3225'), 
    ('Karachi','9.5511','1.1861'), 
    ('Karachi Container Terminal','9.5511','1.1861'), 
    ('Karachi-Muhammad Bin Qasim','9.5511','1.1861'), 
    ('Gdansk','54.3667','18.6333'), 
    ('Gdynia','54.5189','18.5319'), 
    ('Szczecin','53.4247','14.5553'), 
    ('Aveiro','40.6389','-8.6553'), 
    ('Setúbal','38.5236','-8.8935'), 
    ('Sines','37.9546','-8.8644'), 
    ('Doha','25.3','51.5333'), 
    ('Constanta','44.1733','28.6383'), 
    ('Kaliningrad','54.7167','20.5'), 
    ('Murmansk','68.9667','33.0833'), 
    ('Novorossiysk','44.7167','37.7667'), 
    ('Vladivostok','43.1167','131.9'), 
    ('Saint Petersburg','51.3651','1.4191'), 
    ('Kigali','-1.9536','30.0606'), 
    ('Ad Dammam','26.4333','50.1'), 
    ('Jubail','4.85','31.6'), 
    ('Yanbu al-Bahr','-17.5333','177.6833'), 
    ('Jeddah','21.5428','39.1728'), 
    ('Mahe','11.7011','75.5367'), 
    ('Khartoum','15.6031','32.5265'), 
    ('Gothenburg','57.6717','11.981'), 
    ('Singapore','13.1483','33.9311'), 
    ('Koper','45.5475','13.7307'), 
    ('Bratislava','44.7','7.85'), 
    ('Freetown','8.4833','-13.2331'), 
    ('Dakar','14.7319','-17.4572'), 
    ('Mogadishu','2.0408','45.3425'), 
    ('Guadalupe','25.6775','-100.2597'), 
    ('Damascus','30.5009','120.3413'), 
    ('Latakia','-10.738','165.8567'), 
    ('N''Djamena','12.11','15.05'), 
    ('Lome','43.8254','23.2374'), 
    ('Bangkok','13.75','100.5167'), 
    ('Laem Chabang','-6.7303','147.0008'), 
    ('Bizerte','37.2744','9.8739'), 
    ('Gabès','33.8814','10.0983'), 
    ('La Goulette Nord (Halqueloued)','81.7166','-17.8'), 
    ('Rades/Tunis','17.35','82.55'), 
    ('Sfax','34.74','10.76'), 
    ('Sousse','35.8333','10.6333'), 
    ('Tunis','17.35','82.55'), 
    ('Istanbul','41.01','28.9603'), 
    ('Izmir','38.4127','27.1384'), 
    ('Mersin','47.6986','1.5078'), 
    ('Hualien','23.9722','121.6064'), 
    ('Kaohsiung','22.6167','120.3'), 
    ('Keelung (Chilung)','25.1283','121.7419'), 
    ('Taichung','24.15','120.6667'), 
    ('Taipei','25.0478','121.5319'), 
    ('Dar es Salaam','-6.8','39.2833'), 
    ('Mtwara','-10.2736','40.1828'), 
    ('Tanga','-5.0667','39.1'), 
    ('Odessa','31.8831','-102.3406'), 
    ('Kampala','0.3136','32.5811'), 
    ('Long Beach','33.7981','-118.1675'), 
    ('Los Angeles','34.1139','-118.4068'), 
    ('New York','39.9651','-76.7315'), 
    ('Savannah','40.4003','17.5667'), 
    ('Seattle','47.6211','-122.3244'), 
    ('Virginia Beach','47.5169','-92.5128'), 
    ('Houston','6.6114','0.4703'), 
    ('Charleston','32.8153','-79.9628'), 
    ('Oakland','37.7903','-122.2165'), 
    ('Miami','25.7839','-80.2102'), 
    ('Da Nang','18.7893','100.7766'), 
    ('Haiphong','20.8','106.6667'), 
    ('Ho Chi Minh City','6.6114','0.4703'), 
    ('Ho Chi Minh','6.6114','0.4703'), 
    ('Aden','12.8','45.0333'), 
    ('Cape Town','-33.925','18.425'), 
    ('Durban','-29.8583','31.025'), 
    ('East London','51.5072','-0.1275'), 
    ('Port Elizabeth','-33.9581','25.6'), 
    ('Richards Bay','14.1833','121.2833')
    )
    AS c(city, lat, lng)
    WHERE ports like CONCAT('%',c.city,'%');
    
  ALTER TABLE allocation_planning ADD IF NOT EXISTS total_weight INTEGER NOT NULL DEFAULT 0;
  ALTER TABLE allocation_per_customer ADD IF NOT EXISTS total_weight INTEGER NOT NULL DEFAULT 0;

  ALTER TABLE demurrage_and_detention RENAME COLUMN "port_of_loading" TO "origin";
  ALTER TABLE demurrage_and_detention RENAME COLUMN "port_of_discharge" TO "destination";

  ALTER TABLE demurrage_and_detention ADD IF NOT EXISTS dem_det VARCHAR(500);
  ALTER TABLE demurrage_and_detention ADD IF NOT EXISTS _20 INTEGER;
  ALTER TABLE demurrage_and_detention ADD IF NOT EXISTS _40 INTEGER;
  ALTER TABLE demurrage_and_detention ADD IF NOT EXISTS hc INTEGER;
  ALTER TABLE demurrage_and_detention ADD IF NOT EXISTS _45 INTEGER;
  ALTER TABLE demurrage_and_detention ADD IF NOT EXISTS period VARCHAR(500);
  ALTER TABLE demurrage_and_detention ADD IF NOT EXISTS days VARCHAR(500);
  ALTER TABLE demurrage_and_detention ADD IF NOT EXISTS currency VARCHAR(500);
  ALTER TABLE demurrage_and_detention ADD IF NOT EXISTS rate VARCHAR(500);
  ALTER TABLE demurrage_and_detention DROP COLUMN container_usage;
  ALTER TABLE demurrage_and_detention DROP COLUMN container_demurrage;
  ALTER TABLE demurrage_and_detention DROP COLUMN container_detention;

  ALTER TABLE booking_containers ADD IF NOT EXISTS marks_and_number VARCHAR(500) DEFAULT NULL;
  ALTER TABLE booking_containers ADD  IF NOT EXISTS container_number VARCHAR(500) DEFAULT NULL;
  ALTER TABLE booking_containers ADD  IF NOT EXISTS  seal_number VARCHAR(500) DEFAULT NULL;
  ALTER TABLE booking_containers ADD  IF NOT EXISTS  hbl_number VARCHAR(500) DEFAULT NULL;
  ALTER TABLE booking_containers ADD  IF NOT EXISTS  mbl_number VARCHAR(500) DEFAULT NULL;

  ALTER TABLE booking_haulages ADD  IF NOT EXISTS  pickup_date DATE;

  ALTER TABLE booking_container_commodities ADD IF NOT EXISTS booking_id INTEGER;
  ALTER TABLE booking_container_commodities  ADD FOREIGN KEY (booking_id) REFERENCES bookings(id);
  
  ALTER TABLE booking_container_commodities ADD IF NOT EXISTS marks_and_number VARCHAR(500) DEFAULT NULL;
  ALTER TABLE booking_container_commodities ADD IF NOT EXISTS container_number VARCHAR(500) DEFAULT NULL;
  ALTER TABLE booking_container_commodities ADD IF NOT EXISTS seal_number VARCHAR(500) DEFAULT NULL;

  ALTER TABLE bookings ADD IF NOT EXISTS status VARCHAR(200) DEFAULT 'open';

  ALTER TABLE quotation_local_charges ADD IF NOT EXISTS carrier VARCHAR(500);

  ALTER TABLE customer_request ADD IF NOT EXISTS cargo_weight VARCHAR(500);

  ALTER TABLE customer_request ADD IF NOT EXISTS pol_details VARCHAR(500);

  ALTER TABLE customer_request ADD IF NOT EXISTS remark VARCHAR(500);

  ALTER TABLE quotation_local_charges ADD IF NOT EXISTS contract_number VARCHAR(500);

  ALTER TABLE customer_details ADD IF NOT EXISTS "auth_user_id" VARCHAR(50) DEFAULT NULL;
  
  ALTER TABLE demurrage_and_detention ALTER COLUMN _20 TYPE NUMERIC(20,2);
  ALTER TABLE demurrage_and_detention ALTER COLUMN _40 TYPE NUMERIC(20,2);
  ALTER TABLE demurrage_and_detention ALTER COLUMN hc TYPE NUMERIC(20,2);
  ALTER TABLE demurrage_and_detention ALTER COLUMN _45 TYPE NUMERIC(20,2);

  ALTER TABLE quotation_rate_output ADD IF NOT EXISTS reefer_20 NUMERIC(20,2) NOT NULL DEFAULT 0;
  ALTER TABLE quotation_rate_output ADD IF NOT EXISTS reefer_40 NUMERIC(20,2) NOT NULL DEFAULT 0;
  ALTER TABLE quotation_rate_output ADD IF NOT EXISTS reefer_40hc NUMERIC(20,2) NOT NULL DEFAULT 0;
  ALTER TABLE quotation_rate_output ADD IF NOT EXISTS nor_20 NUMERIC(20,2) NOT NULL DEFAULT 0;
  ALTER TABLE quotation_rate_output ADD IF NOT EXISTS nor_40 NUMERIC(20,2) NOT NULL DEFAULT 0;
  ALTER TABLE quotation_rate_output ADD IF NOT EXISTS nor_40hc NUMERIC(20,2) NOT NULL DEFAULT 0;
  ALTER TABLE quotation_rate_output ADD IF NOT EXISTS via VARCHAR(500);
  ALTER TABLE quotation_rate_output ADD IF NOT EXISTS vessel VARCHAR(500);
  ALTER TABLE quotation_rate_output ADD IF NOT EXISTS voyage_number VARCHAR(500);
  ALTER TABLE quotation_rate_output ADD IF NOT EXISTS soc_coc VARCHAR(500);
  ALTER TABLE quotation_rate_output ADD IF NOT EXISTS tariff_45 NUMERIC(20,2) NOT NULL DEFAULT 0;
  ALTER TABLE quotation_rate_output ADD IF NOT EXISTS currency VARCHAR(500);
  ALTER TABLE quotation_rate_output ADD IF NOT EXISTS route_code VARCHAR(500);
  ALTER TABLE document ADD IF NOT EXISTS carrier_name VARCHAR(500) DEFAULT NULL;
  ALTER TABLE quotation_rate_output
  ADD COLUMN "created_on" TIMESTAMP NULL,
  ADD COLUMN "created_by" VARCHAR(50) NULL,
  ADD COLUMN "updated_on" TIMESTAMP NULL,
  ADD COLUMN "updated_by" VARCHAR(50) NULL,
  ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT false;


  ALTER TABLE quotation_requests ADD IF NOT EXISTS type VARCHAR(100) NOT NULL DEFAULT 'CUSTOMER_REQUEST';
  ALTER TABLE quotation_requests ADD IF NOT EXISTS eta TIMESTAMP;
  ALTER TABLE quotation_requests ADD IF NOT EXISTS etd TIMESTAMP;

  ALTER TABLE my_quotations ADD IF NOT EXISTS eta TIMESTAMP;
  ALTER TABLE my_quotations ADD IF NOT EXISTS etd TIMESTAMP;
  

  ALTER TABLE my_quotations ALTER COLUMN total_amount TYPE NUMERIC(10,2);

  ALTER TABLE my_quotations ADD IF NOT EXISTS weight_20 NUMERIC(20,2) NOT NULL DEFAULT 0;

  ALTER TABLE my_quotations ADD IF NOT EXISTS weight_40 NUMERIC(20,2) NOT NULL DEFAULT 0;

  ALTER TABLE my_quotations ADD IF NOT EXISTS weight_hc NUMERIC(20,2) NOT NULL DEFAULT 0;


  ALTER TABLE quotation_requests ADD IF NOT EXISTS transit_time INTEGER;

  ALTER TABLE quotation_requests ADD IF NOT EXISTS weight_20 NUMERIC(20,2) NOT NULL DEFAULT 0;

  ALTER TABLE quotation_requests ADD IF NOT EXISTS weight_40 NUMERIC(20,2) NOT NULL DEFAULT 0;

  ALTER TABLE quotation_requests ADD IF NOT EXISTS weight_hc NUMERIC(20,2) NOT NULL DEFAULT 0;
  
  ALTER TABLE my_quotations ADD IF NOT EXISTS transit_time INTEGER;

  ALTER TABLE customer_details ALTER COLUMN trade_lane TYPE VARCHAR(2000);

  ALTER TABLE demurrage_and_detention ADD IF NOT EXISTS reefer NUMERIC(20,2);
  ALTER TABLE demurrage_and_detention ADD IF NOT EXISTS special_equipment NUMERIC(20,2);
  ALTER TABLE demurrage_and_detention ADD IF NOT EXISTS rate_per_day NUMERIC(20,2);
  ALTER TABLE quotation_rate_output ADD IF NOT EXISTS contract_owner VARCHAR(500)  DEFAULT NULL ;
  ALTER TABLE document ADD IF NOT EXISTS shared_with VARCHAR(500) DEFAULT NULL;

  ALTER TABLE bookings ADD IF NOT EXISTS quotation_request_id INTEGER;
  ALTER TABLE bookings ADD IF NOT EXISTS cover_insurance boolean NOT NULL DEFAULT false;
  ALTER TABLE bookings ADD IF NOT EXISTS invoice_value NUMERIC(20,2);
  ALTER TABLE bookings ADD IF NOT EXISTS premium_amount NUMERIC(20,2);

  ALTER TABLE bookings ADD IF NOT EXISTS "masterBl" VARCHAR(100);
  
  CREATE SEQUENCE IF NOT EXISTS alphanumeric_booking_id_seq
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 1
  CACHE 1;

  ALTER TABLE ONLY bookings 
  ADD IF NOT EXISTS "blNumber" VARCHAR(100)
  DEFAULT TO_CHAR(nextval('alphanumeric_booking_id_seq'::regclass),'"BLSD"fm000000000000');

  ALTER TABLE quotation_requests  ADD IF NOT EXISTS "isSentSI" boolean NOT NULL DEFAULT false;

  ALTER TABLE booking_container_commodity_cartons  ADD IF NOT EXISTS "grossWeight" INTEGER NOT NULL DEFAULT 0;

  ALTER TABLE quotation_requests ADD IF NOT EXISTS "loadType" VARCHAR(500) NOT NULL DEFAULT 'FCL';
  ALTER TABLE quotation_requests ADD IF NOT EXISTS "volume" NUMERIC(20,2);
  ALTER TABLE quotation_requests ADD IF NOT EXISTS "packageDetails" VARCHAR;
  ALTER TABLE quotation_local_charges ADD IF NOT EXISTS "export_import" VARCHAR(100);
  ALTER TABLE quotation_local_charges ADD IF NOT EXISTS "remarks" VARCHAR(500);
  ALTER TABLE quotation_local_charges ADD IF NOT EXISTS "mandatory_extra" VARCHAR(500);
  ALTER TABLE quotation_local_charges ADD IF NOT EXISTS tariff_45 NUMERIC(20,2) NOT NULL DEFAULT 0;

  ALTER TABLE quotation_local_charges
  ADD COLUMN "created_on" TIMESTAMP NULL,
  ADD COLUMN "created_by" VARCHAR(50) NULL,
  ADD COLUMN "updated_on" TIMESTAMP NULL,
  ADD COLUMN "updated_by" VARCHAR(50) NULL,
  ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT false;

  ALTER TABLE public.quotation_local_charges ALTER COLUMN remarks TYPE VARCHAR(10000);

  ALTER TABLE my_quotations ADD IF NOT EXISTS charges VARCHAR(10000);

  ALTER TABLE my_quotations DROP CONSTRAINT fk_quotation_rate_output;
  
  ALTER TABLE my_quotations ALTER COLUMN quotation_rate_output_id TYPE VARCHAR(100);

  ALTER TABLE quotation_local_charges ADD COLUMN via VARCHAR(500);

  ALTER TABLE quotation_requests ADD IF NOT EXISTS shared_with VARCHAR(500);

  ALTER TABLE user_details
  ADD COLUMN IF NOT EXISTS "company_name" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "country" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "city" VARCHAR(500);
  ADD COLUMN IF NOT EXISTS "user_department" VARCHAR(500);

  ALTER TABLE quotation_local_charges ADD IF NOT EXISTS type VARCHAR(500) DEFAULT NULL;
  ALTER TABLE customer_tier_margin ADD IF NOT EXISTS Membership_fees VARCHAR(500) DEFAULT NULL ;
  ALTER TABLE customer_tier_margin ADD IF NOT EXISTS Procurement_fees VARCHAR(500) DEFAULT NULL ;
  ALTER TABLE customer_tier_margin ADD IF NOT EXISTS Agent_fees VARCHAR(500) DEFAULT NULL ;
  ALTER TABLE quotation_local_charges ADD IF NOT EXISTS type VARCHAR(500) DEFAULT NULL ;

  ALTER TABLE quotation_requests ADD IF NOT EXISTS carrier VARCHAR(500) DEFAULT NULL ;
  ALTER TABLE quotation_requests ADD IF NOT EXISTS total_amount VARCHAR(500) DEFAULT NULL ;

  ALTER TABLE allocation_planning ADD IF NOT EXISTS effective_week INTEGER;
  ALTER TABLE allocation_planning ADD IF NOT EXISTS expiry_week INTEGER;
  ALTER TABLE allocation_planning ADD IF NOT EXISTS service_code VARCHAR(500);
  ALTER TABLE allocation_planning ADD IF NOT EXISTS trade VARCHAR(500);

  ALTER TABLE allocation_planning ALTER start_date DROP NOT NULL;  
  ALTER TABLE allocation_planning ALTER end_date DROP NOT NULL;

  ALTER TABLE quotation_requests ADD PRIMARY KEY (id);

  UPDATE carrier_scac_code SET code = 'CMA' WHERE scac_code = 'CMDU';
  UPDATE carrier_scac_code SET code = 'ONE' WHERE scac_code = 'ONEY';

  ALTER TABLE quotation_rate_output ADD IF NOT EXISTS file_number VARCHAR(50);
  ALTER TABLE quotation_local_charges ADD IF NOT EXISTS file_number VARCHAR(50);

  ALTER TABLE quotation_local_charges ALTER COLUMN tariff_20 TYPE varchar(10000);
	ALTER TABLE quotation_local_charges ALTER COLUMN tariff_40 TYPE varchar(10000);
	ALTER TABLE quotation_local_charges ALTER COLUMN tariff_40hc TYPE varchar(10000);
	ALTER TABLE quotation_local_charges ALTER COLUMN tariff_45 TYPE varchar(10000);
`
pool.connect((err, client, done) => {
  client.query(query, (err, res) => {
    console.log(err, res)
    client.end()
    console.log('Table altered Successfully.');
  });
});

module.exports = pool;
