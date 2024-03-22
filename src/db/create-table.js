require('dotenv').config();
const { Pool } = require('pg');
const { parse } = require('pg-connection-string')
const config = parse(process.env.DATABASE_URL)

config.ssl = {
	rejectUnauthorized: false
}
const pool = new Pool(config)
const tool = new Pool(config)
const query = `
CREATE SEQUENCE IF NOT EXISTS user_id_seq;
CREATE SEQUENCE IF NOT EXISTS contactus_id_seq;
CREATE SEQUENCE IF NOT EXISTS customer_forecast_id_seq;
CREATE SEQUENCE IF NOT EXISTS carrier_allocation_id_seq;
CREATE SEQUENCE IF NOT EXISTS quotation_id_seq;
CREATE SEQUENCE IF NOT EXISTS allocation_id_seq;
CREATE SEQUENCE IF NOT EXISTS target_id_seq;
CREATE SEQUENCE IF NOT EXISTS onload_seq;
CREATE SEQUENCE IF NOT EXISTS customer_seq;
CREATE SEQUENCE IF NOT EXISTS onload_quotation_seq;
CREATE SEQUENCE IF NOT EXISTS qcd_seq;
CREATE SEQUENCE IF NOT EXISTS automation_excel_to_json_id_seq;
CREATE SEQUENCE IF NOT EXISTS quotation_rate_output_id_seq;
CREATE SEQUENCE IF NOT EXISTS my_quotations_id_seq;
CREATE SEQUENCE IF NOT EXISTS quotation_local_charges_id_seq;
CREATE SEQUENCE IF NOT EXISTS allocation_planning_id_seq;
CREATE SEQUENCE IF NOT EXISTS allocation_per_customer_id_seq;
CREATE SEQUENCE IF NOT EXISTS carrier_id_seq;
CREATE SEQUENCE IF NOT EXISTS commodity_id_seq;
CREATE SEQUENCE IF NOT EXISTS weekwise_allocation_id_seq;
CREATE SEQUENCE IF NOT EXISTS demurrage_and_detention_id_seq;
CREATE SEQUENCE IF NOT EXISTS document_id_seq;
CREATE SEQUENCE IF NOT EXISTS notification_id_seq;
CREATE SEQUENCE IF NOT EXISTS invoice_id_seq;
CREATE SEQUENCE IF NOT EXISTS invoice_details_id_seq;
CREATE SEQUENCE IF NOT EXISTS vessel_id_seq;
CREATE SEQUENCE IF NOT EXISTS voyage_id_seq;
CREATE SEQUENCE IF NOT EXISTS voyage_ports_id_seq;
CREATE SEQUENCE IF NOT EXISTS quotation_request_id_seq;
CREATE SEQUENCE IF NOT EXISTS demurrage_and_detention_v2_id_seq;


CREATE SEQUENCE IF NOT EXISTS alphanumeric_allocation_id_seq
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 1
  CACHE 1;

  CREATE SEQUENCE IF NOT EXISTS alphanumeric_my_quotation_id_seq
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 1
  CACHE 1;

CREATE SEQUENCE IF NOT EXISTS alphanumeric_invoice_id_seq
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 1
  CACHE 1;

  CREATE SEQUENCE IF NOT EXISTS voyage_number_seq
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 1
  CACHE 1;

  
  CREATE SEQUENCE IF NOT EXISTS alphanumeric_voyage_uid_seq
  INCREMENT 1
  MINVALUE 1
  MAXVALUE 9223372036854775807
  START 1
  CACHE 1;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "onload_quotation" (
	"id" INTEGER NOT NULL DEFAULT nextval('onload_quotation_seq'),
	"ports" VARCHAR(100) DEFAULT NULL,
	"container_type" VARCHAR(100) DEFAULT NULL,
	"incoterms" VARCHAR(100) DEFAULT NULL,
	"terms" VARCHAR(100) DEFAULT NULL,
	PRIMARY KEY ("id")
);


CREATE TABLE IF NOT EXISTS "customer_details" (
	"customer_id" INTEGER NOT NULL DEFAULT nextval('customer_seq'),
	"firstname" VARCHAR(500) DEFAULT NULL,
    "lastname" VARCHAR(500) DEFAULT NULL,
	"title" VARCHAR(500) DEFAULT NULL,
	"department" VARCHAR(500) DEFAULT NULL,
	"company_name" VARCHAR(500) DEFAULT NULL,
	"revenue" VARCHAR(500) DEFAULT NULL,
	"phone_number" VARCHAR(500) DEFAULT NULL,
	"mobile_number" VARCHAR(500) DEFAULT NULL,
	"fax_number" VARCHAR(500) DEFAULT NULL,
	"primary_emailid" VARCHAR(500) DEFAULT NULL,
	"secondary_emailid" VARCHAR(500) DEFAULT NULL,
	"website" VARCHAR(500) DEFAULT NULL,
	"industry" VARCHAR(500) DEFAULT NULL,
	"address_1" VARCHAR(500) DEFAULT NULL,
	"address_2" VARCHAR(500) DEFAULT NULL,
	"pincode" VARCHAR(500) DEFAULT NULL,
	"city" VARCHAR(500) DEFAULT NULL,
	"country" VARCHAR(500) DEFAULT NULL,
	"lead_owner_id" VARCHAR(500) DEFAULT NULL,
	"lead_owner_first_name" VARCHAR(500) DEFAULT NULL,
	"lead_owner_last_name" VARCHAR(500) DEFAULT NULL,
	"lead_owner_email" VARCHAR(500) DEFAULT NULL,
	"lead_owner_mobile" VARCHAR(500) DEFAULT NULL,
	"lead_location" VARCHAR(500) DEFAULT NULL,
	"lead_source" VARCHAR(500) DEFAULT NULL,
	"deal_amount" VARCHAR(500) DEFAULT NULL,
	"stage" VARCHAR(500) DEFAULT NULL,
	"activity" VARCHAR(500) DEFAULT NULL,
	"probability" VARCHAR(500) DEFAULT NULL,
	"closing_date" VARCHAR(500) DEFAULT NULL,
	"business_type" VARCHAR(500) DEFAULT NULL,
	PRIMARY KEY ("customer_id")
);

CREATE TABLE IF NOT EXISTS "onload_ca" (
	"onload_id" INTEGER NOT NULL DEFAULT nextval('onload_seq'),
	"carrier_name" VARCHAR(500) DEFAULT NULL,
	"logo" VARCHAR(500) DEFAULT NULL,
    "service" VARCHAR(500) DEFAULT NULL,
	"contract_number" VARCHAR(500) DEFAULT NULL,
	"ports" VARCHAR(500) DEFAULT NULL,
	"contract_type" VARCHAR(500) DEFAULT NULL,
	"container_type" VARCHAR(500) DEFAULT NULL,
	PRIMARY KEY ("onload_id")
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" INTEGER NOT NULL DEFAULT nextval('user_id_seq'),
	"name" TEXT NOT NULL,
	"email" CHAR(50) NOT NULL,
    "company" CHAR(50) NOT NULL,
	"created_on" TIMESTAMP NOT NULL,
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "contactus" (
	"id" INTEGER NOT NULL DEFAULT nextval('contactus_id_seq'),
	"name" VARCHAR(500) NOT NULL,
	"email" VARCHAR(500) NOT NULL,
	"mobile" VARCHAR(50) NOT NULL,
	"message" TEXT NOT NULL,
    "created_on" TIMESTAMP NOT NULL,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "customer_forecast" (
	"f_id" INTEGER NOT NULL DEFAULT nextval('customer_forecast_id_seq'),
	"valid_week" VARCHAR(500) NOT NULL,
	"valid_year" VARCHAR(500) NOT NULL,
	"route" VARCHAR(500) NOT NULL,
	"owner" VARCHAR(500) NOT NULL,
	"origin_shipment_type" VARCHAR(500) NOT NULL,
	"dest_shipment_type" VARCHAR(500) NOT NULL,
	"place_of_receipt" VARCHAR(500) NOT NULL,
	"place_of_delivery" VARCHAR(500) NOT NULL,
	"mother_vessel_discharge_point" VARCHAR(500) NOT NULL,
	"mother_vessel_load_point" VARCHAR(500) NOT NULL,
	"carrier_name" VARCHAR(500) NOT NULL,
	"customer_name" VARCHAR(500) NOT NULL,
	"carrier_service" VARCHAR(500) NOT NULL,
	"equipment_size" VARCHAR(500) NOT NULL,
	"equipment_type" VARCHAR(500) NOT NULL,
	"tarrif_ref" VARCHAR(500) NOT NULL,
	"commodity" VARCHAR(500) NOT NULL,
	"remarks" VARCHAR(500) NOT NULL,
	"heavy_weight" VARCHAR(500) NOT NULL,
	"forward_console" BOOLEAN NOT NULL,
	"created_on" TIMESTAMP NULL,
	"updated_on" TIMESTAMP NULL,
	PRIMARY KEY ("f_id")
);

CREATE TABLE IF NOT EXISTS "carrier_allocation" (
	"c_id" INTEGER NOT NULL DEFAULT nextval('carrier_allocation_id_seq'),
	"allocation_type" VARCHAR(500) NOT NULL,
	"allocation_level" VARCHAR(500) NOT NULL,
	"route" VARCHAR(500) NOT NULL,
	"owner" VARCHAR(500) NOT NULL,
	"from_year" VARCHAR(500) NOT NULL,
	"from_week" VARCHAR(500) NOT NULL,
	"to_year" VARCHAR(500) NOT NULL,
	"to_week" VARCHAR(500) NOT NULL,
	"generic_nac" VARCHAR(500) NOT NULL,
	"commitment" VARCHAR(500) NOT NULL,
	"status" VARCHAR(500) NOT NULL,
	"origin_shipment_type" VARCHAR(500) NOT NULL,
	"dest_shipment_type" VARCHAR(500) NOT NULL,
	"place_of_receipt" VARCHAR(500) NOT NULL,
	"place_of_delivery" VARCHAR(500) NOT NULL,
	"mother_vessel_discharge_point" VARCHAR(500) NOT NULL,
	"mother_vessel_load_point" VARCHAR(500) NOT NULL,
	"carrier_name" VARCHAR(500) NOT NULL,
	"customers" VARCHAR(500) NOT NULL,
	"carrier_service" VARCHAR(500) NOT NULL,
	"tarrif_ref" VARCHAR(500) NOT NULL,
	"equipment_type" VARCHAR(500) NOT NULL,
	"equipment_size" VARCHAR(500) NOT NULL,
	"space_status" VARCHAR(500) NOT NULL,
	"allocation_per_week" VARCHAR(500) NOT NULL,
	"total_allocation" VARCHAR(500) NOT NULL,
	"commodity" VARCHAR(500) NOT NULL,
	"remarks" VARCHAR(500) NOT NULL,
	"heavy_weight" VARCHAR(500) NOT NULL,
	"paying_cargo" VARCHAR(500) NOT NULL,
	"overbooking_allowance" VARCHAR(500) NOT NULL,
	"created_on" TIMESTAMP NULL,
	"updated_on" TIMESTAMP NULL,
	PRIMARY KEY ("c_id")
	);
	CREATE TABLE IF NOT EXISTS "automation_excel_to_json"(
		"e_id" INTEGER NOT NULL DEFAULT nextval('automation_excel_to_json_id_seq'),
		"doc_type" VARCHAR (500) NOT NULL,
		"doc_number" VARCHAR (1000) NOT NULL,
		"doc_name" VARCHAR (1000) NOT NULL,
		"doc_provider" VARCHAR (1000) NOT NULL,
		"doc_location" VARCHAR (1000) NOT NULL,
		"upload_status" VARCHAR (100) NOT NULL,
		"uploaded_on" TIMESTAMP NULL,
		PRIMARY KEY ("e_id")
	
	);
	
	CREATE TABLE IF NOT EXISTS "quotation" (
		"q_id" INTEGER NOT NULL DEFAULT nextval('quotation_id_seq'),
		"origin" VARCHAR(500) NOT NULL,
		"destination" VARCHAR(500) NOT NULL,
		"contract_name" VARCHAR(500) NOT NULL,
		"container_type" VARCHAR(500) NOT NULL,
		"container_size" VARCHAR(500) NOT NULL,
		"container_quantity" VARCHAR(500) NOT NULL,
		"container_weight" VARCHAR(500) NOT NULL,
		"cargo_ready_date" TIMESTAMP NOT NULL,
		"incoterms"  VARCHAR(500) NOT NULL,
	"type" VARCHAR(500) NOT NULL,
	"created_on" TIMESTAMP NULL,
	"updated_on" TIMESTAMP NULL,
	PRIMARY KEY ("q_id")
);

CREATE TABLE IF NOT EXISTS "carrier_allocation_new" (
	"ca_id" INTEGER NOT NULL DEFAULT nextval('allocation_id_seq'),
	"container_type" VARCHAR(500) NOT NULL,
	"container_name" VARCHAR(500) NOT NULL,
	"service" VARCHAR(500) NOT NULL,
	"supplier" VARCHAR(500) NOT NULL,
	"origin" VARCHAR(500) NOT NULL,
	"destination" VARCHAR(500) NOT NULL,
	"sailing" VARCHAR(500) NOT NULL,
	"type" VARCHAR(500) NOT NULL,
	"total_allocated_space" VARCHAR(500) NOT NULL,
	"actual_allocated_space" VARCHAR(500) DEFAULT NULL,
	"uom" VARCHAR(500) DEFAULT NULL,
	"planned_costs" VARCHAR(500) DEFAULT NULL,
	"actual_costs" VARCHAR(500) DEFAULT NULL,
	"start_date" VARCHAR(500) NOT NULL,
	"end_date" VARCHAR(500) NOT NULL,
	"created_on" TIMESTAMP NULL,
	"updated_on" TIMESTAMP NULL,
	"week_1" VARCHAR(50) DEFAULT -1 NULL,
	"week_2" VARCHAR(50) DEFAULT -1 NULL,
	"week_3" VARCHAR(50) DEFAULT -1 NULL,
	"week_4" VARCHAR(50) DEFAULT -1 NULL,
	"week_5" VARCHAR(50) DEFAULT -1 NULL,
	"week_6" VARCHAR(50) DEFAULT -1 NULL,
	"week_7" VARCHAR(50) DEFAULT -1 NULL,
	"week_8" VARCHAR(50) DEFAULT -1 NULL,
	"week_9" VARCHAR(50) DEFAULT -1 NULL,
	"week_10" VARCHAR(50) DEFAULT -1 NULL,
	"week_11" VARCHAR(50) DEFAULT -1 NULL,
	"week_12" VARCHAR(50) DEFAULT -1 NULL,
	"week_13" VARCHAR(50) DEFAULT -1 NULL,
	"week_14" VARCHAR(50) DEFAULT -1 NULL,
	"week_15" VARCHAR(50) DEFAULT -1 NULL,
	"week_16" VARCHAR(50) DEFAULT -1 NULL,
	"week_17" VARCHAR(50) DEFAULT -1 NULL,
	"week_18" VARCHAR(50) DEFAULT -1 NULL,
	"week_19" VARCHAR(50) DEFAULT -1 NULL,
	"week_20" VARCHAR(50) DEFAULT -1 NULL,
	"week_21" VARCHAR(50) DEFAULT -1 NULL,
	"week_22" VARCHAR(50) DEFAULT -1 NULL,
	"week_23" VARCHAR(50) DEFAULT -1 NULL,
	"week_24" VARCHAR(50) DEFAULT -1 NULL,
	"week_25" VARCHAR(50) DEFAULT -1 NULL,
	"week_26" VARCHAR(50) DEFAULT -1 NULL,
	"week_27" VARCHAR(50) DEFAULT -1 NULL,
	"week_28" VARCHAR(50) DEFAULT -1 NULL,
	"week_29" VARCHAR(50) DEFAULT -1 NULL,
	"week_30" VARCHAR(50) DEFAULT -1 NULL,
	"week_31" VARCHAR(50) DEFAULT -1 NULL,
	"week_32" VARCHAR(50) DEFAULT -1 NULL,
	"week_33" VARCHAR(50) DEFAULT -1 NULL,
	"week_34" VARCHAR(50) DEFAULT -1 NULL,
	"week_35" VARCHAR(50) DEFAULT -1 NULL,
	"week_36" VARCHAR(50) DEFAULT -1 NULL,
	"week_37" VARCHAR(50) DEFAULT -1 NULL,
	"week_38" VARCHAR(50) DEFAULT -1 NULL,
	"week_39" VARCHAR(50) DEFAULT -1 NULL,
	"week_40" VARCHAR(50) DEFAULT -1 NULL,
	"week_41" VARCHAR(50) DEFAULT -1 NULL,
	"week_42" VARCHAR(50) DEFAULT -1 NULL,
	"week_43" VARCHAR(50) DEFAULT -1 NULL,
	"week_44" VARCHAR(50) DEFAULT -1 NULL,
	"week_45" VARCHAR(50) DEFAULT -1 NULL,
	"week_46" VARCHAR(50) DEFAULT -1 NULL,
	"week_47" VARCHAR(50) DEFAULT -1 NULL,
	"week_48" VARCHAR(50) DEFAULT -1 NULL,
	"week_49" VARCHAR(50) DEFAULT -1 NULL,
	"week_50" VARCHAR(50) DEFAULT -1 NULL,
	"week_51" VARCHAR(50) DEFAULT -1 NULL,
	"week_52" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_1" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_2" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_3" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_4" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_5" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_6" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_7" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_8" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_9" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_10" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_11" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_12" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_13" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_14" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_15" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_16" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_17" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_18" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_19" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_20" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_21" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_22" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_23" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_24" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_25" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_26" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_27" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_28" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_29" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_30" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_31" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_32" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_33" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_34" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_35" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_36" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_37" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_38" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_39" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_40" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_41" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_42" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_43" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_44" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_45" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_46" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_47" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_48" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_49" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_50" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_51" VARCHAR(50) DEFAULT -1 NULL,
	"actual_week_52" VARCHAR(50) DEFAULT -1 NULL,
	PRIMARY KEY ("ca_id")
);

CREATE TABLE IF NOT EXISTS "quotation_company_details" (
	"id" INTEGER NOT NULL DEFAULT nextval('qcd_seq'),
	"company_name" VARCHAR(500),
	"company_logo" VARCHAR(500),
	"quotation_number" VARCHAR(500),
	"valid_from" VARCHAR(500),
	"valid_to" VARCHAR(500),
	"contract_number" VARCHAR(500),
	"port_of_loading" VARCHAR(500),
	"port_of_discharge" VARCHAR(500),
	"quote_20_oceanfreight" VARCHAR(500),
	"quote_40_oceanfreight" VARCHAR(500),
	"quote_hc_oceanfreight" VARCHAR(500),
	"quote_20_bunkeradjustmentfactor" VARCHAR(500),
	"quote_40_bunkeradjustmentfactor" VARCHAR(500),
	"quote_hc_bunkeradjustmentfactor" VARCHAR(500),
	"quote_oc_20_originterminalhandlingcharges" VARCHAR(500),
	"quote_oc_40_originterminalhandlingcharges" VARCHAR(500),
	"quote_oc_hc_originterminalhandlingcharges" VARCHAR(500),
	"quote_oc_20_originisps" VARCHAR(500),
	"quote_oc_40_originisps" VARCHAR(500),
	"quote_oc_hc_originisps" VARCHAR(500),
	"quote_oc_20_sealfee" VARCHAR(500),
	"quote_oc_40_sealfee" VARCHAR(500),
	"quote_oc_hc_sealfee" VARCHAR(500),
	"quote_dc_20_destinationterminalhandlingcharges" VARCHAR(500),
	"quote_dc_40_destinationterminalhandlingcharges" VARCHAR(500),
	"quote_dc_hc_destinationterminalhandlingcharges" VARCHAR(500),
	"quote_dc_20_destinationisps" VARCHAR(500),
	"quote_dc_40_destinationisps" VARCHAR(500),
	"quote_dc_hc_destinationisps" VARCHAR(500),
	"quote_20_total" VARCHAR(500),
	"quote_40_total" VARCHAR(500),
	"quote_hc_total" VARCHAR(500),
	"buyorsell_fc_baserate" VARCHAR(500),
	"buyorsell_fc_sulphursurcharge" VARCHAR(500),
	"buyorsell_dc_destinationterminalhandlingcharges" VARCHAR(500),
	"buyorsell_oc_exportservicecharge" VARCHAR(500),
	"buyorsell_oc_destinationterminalhandlingcharges" VARCHAR(500),
	PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "user_details" (
	"user_id" uuid DEFAULT uuid_generate_v1mc (),
	"auth_user_id" VARCHAR(50) NOT NULL,
	"first_name" VARCHAR(500) DEFAULT NULL,
    "last_name" VARCHAR(500) DEFAULT NULL,
	"license_type" VARCHAR(500) NOT NULL,
	"created_by" VARCHAR(50) NOT NULL,
    "created_on" TIMESTAMP NOT NULL,
	"updated_by" VARCHAR(50) NOT NULL,
    "updated_on" TIMESTAMP NOT NULL,
	"contact_no" VARCHAR(20) DEFAULT NULL,
    PRIMARY KEY ("user_id")
);

CREATE TABLE IF NOT EXISTS "roles" (
	"role_id" uuid DEFAULT uuid_generate_v1mc (),
	"name" VARCHAR(100) NOT NULL,
	"created_by" VARCHAR(50) NOT NULL,
    "created_on" TIMESTAMP NOT NULL,
	"updated_by" VARCHAR(50) NOT NULL,
    "updated_on" TIMESTAMP NOT NULL,
	"is_active" BOOLEAN NOT NULL,
    PRIMARY KEY ("role_id")
);

CREATE TABLE IF NOT EXISTS "permissions" (
	"permission_id" uuid DEFAULT uuid_generate_v1mc (),
	"name" VARCHAR(100) NOT NULL,
	"ref_value" VARCHAR(100) NOT NULL,
	"created_by" VARCHAR(50) NOT NULL,
    "created_on" TIMESTAMP NOT NULL,
	"updated_by" VARCHAR(50) NOT NULL,
    "updated_on" TIMESTAMP NOT NULL,
	"is_active" BOOLEAN NOT NULL,
    PRIMARY KEY ("permission_id")
);

CREATE TABLE IF NOT EXISTS "user_roles" (	
	"user_roles_id" uuid DEFAULT uuid_generate_v1mc (),
	"user_id" VARCHAR(50) NOT NULL,
	"role_id" VARCHAR(500) NOT NULL,
	"created_by" VARCHAR(50) NOT NULL,
    "created_on" TIMESTAMP NOT NULL,
	"updated_by" VARCHAR(50) NOT NULL,
    "updated_on" TIMESTAMP NOT NULL,
	PRIMARY KEY ("user_roles_id")
);

CREATE TABLE IF NOT EXISTS "roles_permission" (	
	"roles_permission_id" uuid DEFAULT uuid_generate_v1mc (),
	"role_id" VARCHAR(50) NOT NULL,
	"permission_id" VARCHAR(50) NOT NULL,
	"created_by" VARCHAR(50) NOT NULL,
    "created_on" TIMESTAMP NOT NULL,
	"updated_by" VARCHAR(50) NOT NULL,
    "updated_on" TIMESTAMP NOT NULL,
    PRIMARY KEY ("roles_permission_id")
);

CREATE TABLE IF NOT EXISTS "quotation_rate_output" (
	"quotation_rate_output_id" INTEGER NOT NULL DEFAULT nextval('quotation_rate_output_id_seq'),
	"contract_type" VARCHAR(500) DEFAULT NULL,
	"carrier" VARCHAR(500) DEFAULT NULL,
	"contract_number" VARCHAR(500) DEFAULT NULL,
	"validity_date_from" TIMESTAMP NOT NULL,
	"validity_date_to" TIMESTAMP NOT NULL,
	"origin" VARCHAR(500) NOT NULL,
	"destination" VARCHAR(500) NOT NULL,
	"tariff_20" NUMERIC(20,2) NOT NULL,
	"tariff_40" NUMERIC(20,2) NOT NULL,
	"tariff_40hc" NUMERIC(20,2) NOT NULL,
	PRIMARY KEY ("quotation_rate_output_id")
);

CREATE TABLE IF NOT EXISTS "my_quotations" (
	"id" INTEGER NOT NULL DEFAULT nextval('my_quotations_id_seq'),
	"quotation_rate_output_id" INTEGER NOT NULL,
	"state" VARCHAR (100) NOT NULL,
	"customer_id" INTEGER NOT NULL,
	"tariff20_charges_sum" VARCHAR(50) NULL,
	"tariff40_charges_sum" VARCHAR(50) NULL,
	"tariff40hc_charges_sum" VARCHAR(50) NULL,
	"created_on" TIMESTAMP NULL,
	"created_by" VARCHAR(50) NULL,
	"updated_on" TIMESTAMP NULL,
	"updated_by" VARCHAR(50) NULL,
	"store_date" TIMESTAMP,
	commodity VARCHAR(500) DEFAULT NULL,
	weight INTEGER NOT NULL DEFAULT 0,
	type_of_margin VARCHAR(10) DEFAULT NULL,
	sur_charges INTEGER NOT NULL,
	margin INTEGER NOT NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT fk_quotation_rate_output
	FOREIGN KEY(quotation_rate_output_id) 
	REFERENCES quotation_rate_output(quotation_rate_output_id),
	CONSTRAINT fk_my_quotation_customer_details
	FOREIGN KEY(customer_id) 
	REFERENCES customer_details(customer_id)
);

CREATE TABLE IF NOT EXISTS "quotation_local_charges" (
	"quotation_local_charges_id" INTEGER NOT NULL DEFAULT nextval('quotation_local_charges_id_seq'),
	"validity_date_from" TIMESTAMP NOT NULL,
	"validity_date_to" TIMESTAMP NOT NULL,
	"origin" VARCHAR(500) NOT NULL,
	"destination" VARCHAR(500) NOT NULL,
	"charge_type" VARCHAR(50) DEFAULT NULL,
	"charge_name" VARCHAR(500) DEFAULT NULL,
	"charge_code" VARCHAR(50) DEFAULT NULL,
	"currency" VARCHAR(50) DEFAULT NULL,	
	"tariff_20" NUMERIC(20,2) DEFAULT NULL,
	"tariff_40" NUMERIC(20,2) DEFAULT NULL,
	"tariff_40hc" NUMERIC(20,2) DEFAULT NULL,
	PRIMARY KEY ("quotation_local_charges_id")
);

CREATE TABLE IF NOT EXISTS "quotation_extra_local_charges" (
	"quotation_extra_local_charges_id" uuid DEFAULT uuid_generate_v1mc (),
	"origin" VARCHAR(500) NOT NULL,
	"destination" VARCHAR(500) NOT NULL,
	"charge_type" VARCHAR(50) DEFAULT NULL,
	"charge_name" VARCHAR(500) DEFAULT NULL,
	"charge_code" VARCHAR(50) DEFAULT NULL,
	"currency" VARCHAR(50) DEFAULT NULL,
	"tariff_20" NUMERIC(20,2) DEFAULT NULL,
	"tariff_40" NUMERIC(20,2) DEFAULT NULL,
	"tariff_40hc" NUMERIC(20,2) DEFAULT NULL,
	"created_on" TIMESTAMP NULL,
	"created_by" VARCHAR(50) NULL,
	"updated_on" TIMESTAMP NULL,
	"updated_by" VARCHAR(50) NULL,
	PRIMARY KEY ("quotation_extra_local_charges_id")
);

CREATE TABLE IF NOT EXISTS "my_quotations_extra_local_charges" (
	"id" uuid DEFAULT uuid_generate_v1mc (),
	"my_quotations_id" INTEGER NOT NULL,
	"quotation_extra_local_charges_id" VARCHAR(50) NOT NULL,
	"origin" VARCHAR(500) NOT NULL,
	"destination" VARCHAR(500) NOT NULL,
	"charge_type" VARCHAR(50) DEFAULT NULL,
	"charge_name" VARCHAR(500) DEFAULT NULL,
	"charge_code" VARCHAR(50) DEFAULT NULL,
	"currency" VARCHAR(50) DEFAULT NULL,
	"tariff_20" NUMERIC(20,2) DEFAULT NULL,
	"tariff_40" NUMERIC(20,2) DEFAULT NULL,
	"tariff_40hc" NUMERIC(20,2) DEFAULT NULL,
	"created_on" TIMESTAMP NULL,
	"created_by" VARCHAR(50) NULL,
	"updated_on" TIMESTAMP NULL,
	"updated_by" VARCHAR(50) NULL,
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "allocation_planning" (
	"id" INTEGER NOT NULL DEFAULT nextval('allocation_planning_id_seq'),
	"allocation_id" VARCHAR(50) NOT NULL DEFAULT TO_CHAR(nextval('alphanumeric_allocation_id_seq'::regclass),'"AL"fm000000000000'),
	"type" VARCHAR(500) NOT NULL,
	"carrier" VARCHAR(500) NOT NULL,
	"contract_number" VARCHAR(500) NOT NULL,
	"preffered_supplier" VARCHAR(500) NOT NULL,
	"origin" VARCHAR(500) NOT NULL,
	"destination" VARCHAR(500) NOT NULL,
	"sailing" VARCHAR(500) NOT NULL,
	"contract_type" VARCHAR(500) NOT NULL,
	"uom" VARCHAR(500) DEFAULT NULL,
	"total_allocated_space" NUMERIC(20,2) NOT NULL,
	"start_date" TIMESTAMP NOT NULL,
	"end_date" TIMESTAMP NOT NULL,
	"created_on" TIMESTAMP NULL,
	"created_by" VARCHAR(50) NULL,
	"updated_on" TIMESTAMP NULL,
	"updated_by" VARCHAR(50) NULL,
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "allocation_per_customer" (
	"id" INTEGER NOT NULL DEFAULT nextval('allocation_per_customer_id_seq'),
	"allocation_planning_id" INTEGER NOT NULL,
	"customer_id" INTEGER NOT NULL,
	"teu" NUMERIC(20,2) NOT NULL,
	"created_on" TIMESTAMP NULL,
	"created_by" VARCHAR(50) NULL,
	"updated_on" TIMESTAMP NULL,
	"updated_by" VARCHAR(50) NULL,
	PRIMARY KEY ("id"),
	CONSTRAINT fk_allocation_planning_customer_allocation
	FOREIGN KEY(allocation_planning_id)
	REFERENCES allocation_planning(id),
	CONSTRAINT fk_allocation_planning_customer_details
	FOREIGN KEY(customer_id)
	REFERENCES customer_details(customer_id)
);

CREATE TABLE IF NOT EXISTS "carrier_scac_code" (
	"id" INTEGER NOT NULL DEFAULT nextval('carrier_id_seq'),
	"code" VARCHAR(100) DEFAULT NULL,
	"name" VARCHAR(100) DEFAULT NULL,
	"scac_code" VARCHAR(100) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS "commodity_hs_code" (
	"id" INTEGER NOT NULL DEFAULT nextval('commodity_id_seq'),
	"hs_code" INTEGER NOT NULL,
	"product_description" VARCHAR(500) DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS "weekwise_allocation" (
	"id" INTEGER NOT NULL DEFAULT nextval('weekwise_allocation_id_seq'),
	"allocation_planning_id" INTEGER NOT NULL,
	"week" INTEGER NOT NULL,
	"teu" INTEGER DEFAULT 0,
	"created_on" TIMESTAMP NULL,
	"created_by" VARCHAR(50) NULL,
	"updated_on" TIMESTAMP NULL,
	"updated_by" VARCHAR(50) NULL,
	CONSTRAINT fk_allocation_planning_weekwise_allocation
	FOREIGN KEY(allocation_planning_id)
	REFERENCES allocation_planning(id)
);

CREATE TABLE IF NOT EXISTS "demurrage_and_detention" (
	"id" INTEGER NOT NULL DEFAULT nextval('demurrage_and_detention_id_seq'),
	"carrier" VARCHAR(500) NULL,
	"port_of_loading" VARCHAR(500) NULL,
	"port_of_discharge" VARCHAR(500) NULL,
	"container_usage" VARCHAR(500) NULL,
	"container_demurrage" VARCHAR(500) NULL,
	"container_detention" VARCHAR(500) NULL
)

CREATE TABLE IF NOT EXISTS "document" (
	"id" INTEGER NOT NULL DEFAULT nextval('document_id_seq'),
	"type" VARCHAR(500) NOT NULL,
	"name" VARCHAR(500) NOT NULL,
	"file_name" VARCHAR(500) NOT NULL,
	"file_path" VARCHAR(500) NOT NULL,
	"content_type" VARCHAR(500) NOT NULL,
	"file_key" VARCHAR(500) NOT NULL,
	"created_on" TIMESTAMP NULL,
	"created_by" VARCHAR(50) NULL,
	"updated_on" TIMESTAMP NULL,
	"updated_by" VARCHAR(50) NULL,
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notifications" (
	"id" INTEGER NOT NULL DEFAULT nextval('notification_id_seq'),
	"type" VARCHAR(200) NOT NULL,
	"audience" VARCHAR(200) NOT NULL,
	"message" VARCHAR(500) NOT NULL,
	"details" VARCHAR(1000) NOT NULL,
	"deleted" BOOLEAN NOT NULL DEFAULT false,
	"created_on" TIMESTAMP NULL,
	"created_by" VARCHAR(50) NULL,
	"updated_on" TIMESTAMP NULL,
	"updated_by" VARCHAR(50) NULL,
	PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "invoices" (
	"invoice_id" INTEGER NOT NULL DEFAULT nextval('invoice_id_seq'),
	"same_address" BOOLEAN NOT NULL,
	"bill_to_customer_id" INTEGER NOT NULL,
	"bill_to_company_name" VARCHAR(200) NOT NULL,
	"bill_to_address" VARCHAR(500) NOT NULL,
	"bill_to_city" VARCHAR(100) NOT NULL,
	"bill_to_state" VARCHAR(200) NOT NULL,
	"bill_to_zipcode" INTEGER NOT NULL,
	"bill_to_country" VARCHAR(200) NOT NULL,
	"ship_to_customer_id" INTEGER NULL,
	"ship_to_company_name" VARCHAR(200) NULL,
	"ship_to_address" VARCHAR(500) NULL,
	"ship_to_city" VARCHAR(100) NULL,
	"ship_to_state"  VARCHAR(200) NULL,
	"ship_to_zipcode" INTEGER NULL,
	"ship_to_country" VARCHAR(200) NULL,
	"customer_note" VARCHAR(500),
	"created_on" TIMESTAMP NULL,
	"created_by" VARCHAR(50) NULL,
	"updated_on" TIMESTAMP NULL,
	"updated_by" VARCHAR(50) NULL,
	"due_date" TIMESTAMP NULL,
	"status" VARCHAR(500) NOT NULL,
	"tax" INTEGER NOT NULL,
	"amount" INTEGER NOT NULL,
	"balance" INTEGER NOT NULL,
	PRIMARY KEY ("invoice_id")
);

CREATE TABLE IF NOT EXISTS "invoice_details"(
	"id" INTEGER NOT NULL DEFAULT nextval('invoice_details_id_seq'),
	"invoice_id" INTEGER NOT NULL,
	"description" VARCHAR(500) NOT NULL,
	"number_of_units" INTEGER NOT NULL,
	"rate" INTEGER NOT NULL,
	"created_on" TIMESTAMP NULL,
	"created_by" VARCHAR(50) NULL,
	"updated_on" TIMESTAMP NULL,
	"updated_by" VARCHAR(50) NULL,
	FOREIGN KEY(invoice_id) 
	REFERENCES invoices(invoice_id)
)

CREATE TABLE IF NOT EXISTS "vessels"(
	"id" INTEGER NOT NULL DEFAULT nextval('vessel_id_seq'),
	"name" VARCHAR(500) NOT NULL,
	"imo" VARCHAR(500) NULL,
	"vessel_type_generic" VARCHAR(500) NULL,
	"vessel_type_detailed" VARCHAR(500) NULL,
	"mmsi" VARCHAR(500) NULL,
	"call_sign" VARCHAR(500) NULL,
	"flag" VARCHAR(500) NULL,
	"year_built" VARCHAR(500) NULL,
	"home_port" VARCHAR(500) NULL,
	"gross_tonnage" VARCHAR(500) NULL,
	"summer_dwt" VARCHAR(500) NULL,
	"length_overall" VARCHAR(500) NULL,
	"breadth_extreme" VARCHAR(500) NULL,
	"nominal_capacity" VARCHAR(500) NULL,
	"breakdown_in_capacity" VARCHAR(500) NULL,
	"image" VARCHAR(500) NULL,
	"active" BOOLEAN NOT NULL DEFAULT true,
	"created_on" TIMESTAMP NULL,
	"created_by" VARCHAR(50) NULL,
	"updated_on" TIMESTAMP NULL,
	"updated_by" VARCHAR(50) NULL
)

CREATE TABLE IF NOT EXISTS "voyages"(
	"voyage_id" INTEGER NOT NULL DEFAULT nextval('voyage_id_seq'),
	"status" VARCHAR(200),
	"vessel_id" INTEGER NOT NULL,
	"voyage_uid" VARCHAR(500) NULL, 
	"created_on" TIMESTAMP NULL,
	"created_by" VARCHAR(50) NULL,
	"updated_on" TIMESTAMP NULL,
	"updated_by" VARCHAR(50) NULL,
	PRIMARY KEY (voyage_id),
	FOREIGN KEY(vessel_id) 
	REFERENCES vessels(id)	
)

CREATE TABLE IF NOT EXISTS "voyages_ports"(
	"id" INTEGER NOT NULL DEFAULT nextval('voyage_ports_id_seq'),
	"voyage_id" INTEGER NOT NULL,
	"port" VARCHAR(500),
	"number_of_ports" INTEGER NULL,
	"first_port" VARCHAR(500),
	"last_port" VARCHAR(500),
	"port_type" VARCHAR(500),
	"eta" TIMESTAMP NULL,
 	"etb" TIMESTAMP NULL,
	"etd" TIMESTAMP NULL,
	"terminal_address_line1" VARCHAR(500),
	"terminal_city" VARCHAR(500),
	"terminal_state" VARCHAR(500),
	"terminal_country" VARCHAR(500),
	"terminal_zipcode" INTEGER null,
	"container_pickup_address_line1" VARCHAR(500),
	"container-pickup_city" VARCHAR(500),
	"container_pickup_state" VARCHAR(500),
	"container_pickup_country" VARCHAR(500),
	"container_pickup_zipcode" INTEGER NULL,
	"terminal_eta" TIMESTAMP NULL,
	"latest_gatein" TIMESTAMP NULL,
	"vgm_deadline" TIMESTAMP NULL,	
	"customs_clearence" TIMESTAMP NULL,
	"free_time" INTEGER NULL,
	"container_pickup_date" TIMESTAMP NULL,
	"created_on" TIMESTAMP NULL,
	"created_by" VARCHAR(50) NULL,
	"updated_on" TIMESTAMP NULL,
	"updated_by" VARCHAR(50) NULL,
	FOREIGN KEY(voyage_id)
	REFERENCES voyages(voyage_id),
	PRIMARY KEY(id)
	)

	CREATE TABLE IF NOT EXISTS "bookings" (
		id SERIAL PRIMARY KEY,
		creators_role VARCHAR(500) NOT NULL,
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(50) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(50) NULL
	);

	CREATE TABLE IF NOT EXISTS "booking_parties" (
		id SERIAL PRIMARY KEY,
		booking_id INTEGER NOT NULL ,
		party_type VARCHAR(500) NOT NULL,
		party_id INTEGER,
		extension VARCHAR(100),
		reference_number VARCHAR(100),
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(50) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(50) NULL,
		FOREIGN KEY(booking_id)
		REFERENCES bookings(id)
	);

	CREATE TABLE IF NOT EXISTS "booking_containers" (
		id SERIAL PRIMARY KEY,
		booking_id INTEGER NOT NULL,
		container_type VARCHAR(100),
		cargo VARCHAR(500),
		weight INTEGER,
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(50) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(50) NULL,
		FOREIGN KEY(booking_id)
		REFERENCES bookings(id)
	);

	CREATE TABLE IF NOT EXISTS "booking_container_commodities" (
		id SERIAL PRIMARY KEY,
		booking_container_id INTEGER NOT NULL,
		cargo_description VARCHAR(500),
		hs_code VARCHAR(500),
		cargo_weight INTEGER,
		gross_volume INTEGER,
		is_cargo_hazardous BOOLEAN,
		additional_info VARCHAR(500),
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(50) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(50) NULL,
		FOREIGN KEY(booking_container_id)
		REFERENCES booking_containers(id)
	);

	CREATE TABLE IF NOT EXISTS "booking_container_commodity_cartons" (
		id SERIAL PRIMARY KEY,
		booking_container_commodity_id INTEGER NOT NULL,
		length INTEGER,
		width INTEGER,
		height INTEGER,
		no_of_cartons INTEGER,
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(50) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(50) NULL,
		FOREIGN KEY(booking_container_commodity_id)
		REFERENCES booking_container_commodities(id)
	);
	
	CREATE TABLE IF NOT EXISTS "booking_haulages" (
		id SERIAL PRIMARY KEY,
		booking_id INTEGER NOT NULL,
		contact_id INTEGER,
		empty_pickup_date DATE,
		empty_pickup_time TIME,
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(50) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(50) NULL,
		FOREIGN KEY(booking_id)
		REFERENCES bookings(id)
	);

	CREATE TABLE IF NOT EXISTS "booking_carriages" (
		id SERIAL PRIMARY KEY,
		booking_id INTEGER NOT NULL,
		pre_start_location VARCHAR(500),
		pre_end_location VARCHAR(500),
		pre_etd DATE,
		pre_eta DATE,
		pre_mode VARCHAR(200),
		post_start_location VARCHAR(500),
		post_end_location VARCHAR(500),
		post_etd DATE,
		post_eta DATE,
		post_mode VARCHAR(200),
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(50) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(50) NULL,
		FOREIGN KEY(booking_id)
		REFERENCES bookings(id)
	);

	CREATE TABLE IF NOT EXISTS "booking_carriages_main"(
		id SERIAL PRIMARY KEY,
		booking_id INTEGER NOT NULL,
		main_port_of_load VARCHAR(500),
		main_port_of_discharge VARCHAR(500),
		main_etd DATE,
		main_eta DATE,
		main_vessel INTEGER,
		main_voyage INTEGER,
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(50) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(50) NULL
	);

	CREATE TABLE IF NOT EXISTS "booking_payments" (
		id SERIAL PRIMARY KEY,
		booking_id INTEGER NOT NULL,
		charge_type VARCHAR(200),
		payment_term VARCHAR(200),
		payer VARCHAR(200),
		payment_location VARCHAR(500),
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(50) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(50) NULL,
		FOREIGN KEY(booking_id)
		REFERENCES bookings(id)
	);

	CREATE TABLE IF NOT EXISTS "booking_notifications" (
		id SERIAL PRIMARY KEY,
		booking_id INTEGER NOT NULL,
		customer_comment VARCHAR(1000),
		email_ids VARCHAR(1000),
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(50) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(50) NULL,
		FOREIGN KEY(booking_id)
		REFERENCES bookings(id)
	);

	CREATE TABLE IF NOT EXISTS "booking_templates" (
		id SERIAL PRIMARY KEY,
		name VARCHAR(200),
		booking_id INTEGER NOT NULL,
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(50) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(50) NULL,
		FOREIGN KEY(booking_id)
		REFERENCES bookings(id)
	);

	CREATE TABLE IF NOT EXISTS "quotation_requests" (
		"id" INTEGER NOT NULL DEFAULT nextval('quotation_request_id_seq'),
		"customer_id" INTEGER NOT NULL,
		"origin" VARCHAR(500) NOT NULL,
		"destination" VARCHAR(500) NOT NULL,
		"tariff_20" NUMERIC(20,2) DEFAULT NULL,
		"tariff_40" NUMERIC(20,2) DEFAULT NULL,
		"tariff_40hc" NUMERIC(20,2) DEFAULT NULL,
		"commodity" VARCHAR(500) DEFAULT NULL,
		"weight" INTEGER NOT NULL DEFAULT 0,
		"cargo_ready_date" TIMESTAMP NOT NULL,
		"store_date" TIMESTAMP NOT NULL,
		"hazardous" BOOLEAN NOT NULL DEFAULT false,
		"status" VARCHAR(100) NOT NULL,
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(50) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(50) NULL,
		"my_quotation_id" INTEGER NULL,
		CONSTRAINT fk_quotation_request_customer_details
		FOREIGN KEY(customer_id) 
		REFERENCES customer_details(customer_id),
		CONSTRAINT fk_quotation_request_my_quotations
		FOREIGN KEY(my_quotation_id) 
		REFERENCES my_quotations(id)
	)

	CREATE TABLE IF NOT EXISTS "customer_tier_margin"(
		id SERIAL PRIMARY KEY,
		"customer_tier1_margin" FLOAT  NULL,
		"customer_tier2_margin" FLOAT  NULL,
		"customer_tier3_margin" FLOAT  NULL,
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(50) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(50) NULL,
	)
    
	CREATE TABLE IF NOT EXISTS "online_user_session"(
		id SERIAL PRIMARY KEY,
		"userID" VARCHAR(50) NOT NULL,
	    "action" VARCHAR(500) NOT NULL,
	    "time"    TIMESTAMP NULL 
	)

	INSERT INTO customer_tier_margin
		(customer_tier1_margin, customer_tier2_margin, customer_tier3_margin)
		VALUES (0, 0, 0);
	
	DROP TABLE "demurrage_and_detention";
	
	CREATE TABLE IF NOT EXISTS "demurrage_and_detention" (
		"id" INTEGER NOT NULL DEFAULT nextval('demurrage_and_detention_id_seq'),
		"type" VARCHAR(200) NULL,
		"carrier" VARCHAR(200) NULL,
		"contract_number" VARCHAR(200) NULL,
		"contract_owner" VARCHAR(200) NULL,
		"validity_date_from" TIMESTAMP NOT NULL,
		"validity_date_to" TIMESTAMP NOT NULL,
		"origin" VARCHAR(500) NOT NULL,
		"destination" VARCHAR(500) NOT NULL,
		"origin_free_time" INTEGER DEFAULT 0,
		"destination_free_time_demurrage" INTEGER DEFAULT 0,
		"destination_free_time_detention" INTEGER DEFAULT 0,
		"destination_free_time_combined" INTEGER DEFAULT 0,
		"destination_free_time_charges_demurrage_20" INTEGER DEFAULT 0,
		"destination_free_time_charges_demurrage_40" INTEGER DEFAULT 0,
		"destination_free_time_charges_demurrage_hc" INTEGER DEFAULT 0,
		"destination_free_time_charges_demurrage_45" INTEGER DEFAULT 0,
		"destination_free_time_charges_demurrage_nor" INTEGER DEFAULT 0,
		"destination_free_time_charges_detention_20" INTEGER DEFAULT 0,
		"destination_free_time_charges_detention_40" INTEGER DEFAULT 0,
		"destination_free_time_charges_detention_hc" INTEGER DEFAULT 0,
		"destination_free_time_charges_detention_45" INTEGER DEFAULT 0,
		"destination_free_time_charges_detention_nor" INTEGER DEFAULT 0,
		"destination_free_time_charges_combined_20" INTEGER DEFAULT 0,
		"destination_free_time_charges_combined_40" INTEGER DEFAULT 0,
		"destination_free_time_charges_combined_hc" INTEGER DEFAULT 0,
		"destination_free_time_charges_combined_45" INTEGER DEFAULT 0,
		"destination_free_time_charges_combined_nor" INTEGER DEFAULT 0,		
	)

	CREATE TABLE IF NOT EXISTS "demurrage_and_detention_v2" (
		"id" uuid DEFAULT uuid_generate_v1mc (),
		"type" VARCHAR(200) NULL,
		"carrier" VARCHAR(200) NULL,
		"origin" VARCHAR(500) NOT NULL,
		"contract_number" VARCHAR(200) NULL,
		"validity_date_from" TIMESTAMP NOT NULL,
		"validity_date_to" TIMESTAMP NOT NULL,
		"origin_port" VARCHAR(200) NULL,
		"destination_port" VARCHAR(500) NOT NULL,
		"free_time" INTEGER DEFAULT 0,
		"day_range" VARCHAR(200) NULL,
		"currency" VARCHAR(50) DEFAULT NULL,
		"destination_free_time_charges_demurrage_20" INTEGER DEFAULT 0,
		"destination_free_time_charges_demurrage_40" INTEGER DEFAULT 0,
		"destination_free_time_charges_demurrage_40hc" INTEGER DEFAULT 0,
		"category" VARCHAR(100) NULL,
		"export_import" VARCHAR(100) NULL,
		"remarks" VARCHAR(200) NULL,
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(50) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(50) NULL,
		"deleted" BOOLEAN NOT NULL DEFAULT false,
		PRIMARY KEY(id)
	)

	CREATE TABLE IF NOT EXISTS quotation_rate_excel_sync
	(
		id uuid DEFAULT uuid_generate_v1mc (),
		doc_id VARCHAR(200) NOT NULL,
		doc_name VARCHAR(500),
		status VARCHAR(200),
		details VARCHAR(1000),
		created_on TIMESTAMP NULL,
		created_by VARCHAR(50) NULL,
		updated_on TIMESTAMP NULL,
		updated_by VARCHAR(50) NULL,
		CONSTRAINT quotation_rate_excel_sync_pkey PRIMARY KEY (id)
	)

	CREATE TABLE IF NOT EXISTS currencies
	(
		currency_id serial PRIMARY KEY,
		currency VARCHAR(500),
		exchange_rate  NUMERIC(20,2),
		created_on TIMESTAMP NULL,
		created_by VARCHAR(50) NULL,
		updated_on TIMESTAMP NULL,
		updated_by VARCHAR(50) NULL
	)

	CREATE TABLE IF NOT EXISTS online_rates
	(
		"online_rate_id" uuid DEFAULT uuid_generate_v1mc (),
		"pol_code" VARCHAR(500) NULL,
		"pol_name" VARCHAR(500) NULL,
		"pod_code" VARCHAR(500) NULL,
		"pod_name" VARCHAR(500) NULL,
		"via_way_name" VARCHAR(500) NULL,
		"carrier_code" VARCHAR(500) NULL,
        "tariff_20gp" NUMERIC(20,2) DEFAULT NULL,
		"tariff_40gp" NUMERIC(20,2) DEFAULT NULL,
		"tariff_40hc" NUMERIC(20,2) DEFAULT NULL,
		"frequency" VARCHAR(500) NULL,
		"transport_day" VARCHAR(500) NULL,
		"etd" TIMESTAMP NULL,
		"eta" TIMESTAMP NULL,
		"vessel_name" VARCHAR(500) NULL,
		"voyage" VARCHAR(500) NULL,
		"route_code" VARCHAR(500) NULL,
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(500) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(500) NULL,
		PRIMARY KEY(online_rate_id)
	)
	
	CREATE TABLE IF NOT EXISTS companies
	(
		"id" uuid DEFAULT uuid_generate_v1mc (),
		"name" VARCHAR(500) NULL,
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(500) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(500) NULL,
		PRIMARY KEY(id)
	)

DROP TABLE allocation_per_customer;

CREATE TABLE IF NOT EXISTS "allocation_per_customer" (
	"id" uuid DEFAULT uuid_generate_v1mc (),
	"allocation_planning_id" INTEGER NOT NULL,
	"company" uuid,
	"teu" NUMERIC(20,2) NOT NULL,
	"week" INTEGER,
	"total_weight" INTEGER,
	"created_on" TIMESTAMP NULL,
	"created_by" VARCHAR(50) NULL,
	"updated_on" TIMESTAMP NULL,
	"updated_by" VARCHAR(50) NULL,
	PRIMARY KEY ("id")
);

	CREATE TABLE IF NOT EXISTS public.online_rates_spottemp
	(
		online_rate_id uuid NOT NULL DEFAULT uuid_generate_v1mc(),
		pol_code character varying(500),
		pol_name character varying(500),
		pod_code character varying(500),
		pod_name character varying(500),
		via_way_name character varying(500),
		carrier_code character varying(500),
		tariff_20gp numeric(20,2) DEFAULT NULL::numeric,
		tariff_40gp numeric(20,2) DEFAULT NULL::numeric,
		tariff_40hc numeric(20,2) DEFAULT NULL::numeric,
		frequency character varying(500),
		transport_day character varying(500),
		etd timestamp,
		eta timestamp,
		vessel_name character varying(500),
		voyage character varying(500),
		route_code character varying(500),
		created_on timestamp,
		created_by character varying(500),
		updated_on timestamp,
		updated_by character varying(500),
		CONSTRAINT online_rates_spottemp_pkey PRIMARY KEY (online_rate_id)
	)

	ALTER TABLE online_rates
	ADD CONSTRAINT online_rates_associate_unique_key UNIQUE (pol_code, pod_code, via_way_name, carrier_code, etd, eta, vessel_name, voyage);
	
	WITH duplicates AS (
		SELECT 
		  pol_code, pod_code, via_way_name, carrier_code, etd, eta, vessel_name, voyage,
		  ROW_NUMBER() OVER (PARTITION BY pol_code, pod_code, via_way_name, carrier_code, etd, eta, vessel_name, voyage ORDER BY ctid) AS row_num
		FROM online_rates
	  )
	  DELETE FROM online_rates
	  WHERE (pol_code, pod_code, via_way_name, carrier_code, etd, eta, vessel_name, voyage) IN (
		SELECT pol_code, pod_code, via_way_name, carrier_code, etd, eta, vessel_name, voyage
		FROM duplicates
		WHERE row_num > 1
	  );
	  
	CREATE TABLE IF NOT EXISTS public.quotation_local_charges_spottemp
(
	quotation_local_charges_id uuid NOT NULL DEFAULT uuid_generate_v1mc(),
    validity_date_from timestamp NOT NULL,
    validity_date_to timestamp NOT NULL,
    origin character varying(500) NOT NULL,
    destination character varying(500) NOT NULL,
    charge_type character varying(50) DEFAULT NULL::character varying,
    charge_name character varying(500) DEFAULT NULL::character varying,
    charge_code character varying(50) DEFAULT NULL::character varying,
    currency character varying(50) DEFAULT NULL::character varying,
    tariff_20 numeric(20,2) DEFAULT NULL::numeric,
    tariff_40 numeric(20,2) DEFAULT NULL::numeric,
    tariff_40hc numeric(20,2) DEFAULT NULL::numeric,
    carrier character varying(500) ,
    export_import character varying(100) ,
    remarks character varying(500) ,
    mandatory_extra character varying(500) ,
    tariff_45 numeric(20,2) NOT NULL DEFAULT 0,
    created_on timestamp,
    created_by character varying(50) ,
    updated_on timestamp,
    updated_by character varying(50) ,
    deleted boolean NOT NULL DEFAULT false,
    via character varying(500) ,
    type character varying(500) DEFAULT NULL::character varying,
    CONSTRAINT quotation_local_charges_spottemp_pkey PRIMARY KEY (quotation_local_charges_id)
)

ALTER TABLE quotation_local_charges
ADD CONSTRAINT quotation_local_charges_associate_unique_key UNIQUE (validity_date_from, validity_date_to, origin, destination, via, charge_type, charge_name, charge_code, carrier, export_import);

WITH duplicates AS (
  SELECT 
	validity_date_from, validity_date_to, origin, destination, via, charge_type, charge_name, charge_code, carrier,
    ROW_NUMBER() OVER (PARTITION BY validity_date_from, validity_date_to, origin, destination, via, charge_type, charge_name, charge_code, carrier ORDER BY ctid) AS row_num
  FROM quotation_local_charges
)
DELETE FROM quotation_local_charges
WHERE (validity_date_from, validity_date_to, origin, destination, via, charge_type, charge_name, charge_code, carrier) IN (
  SELECT validity_date_from, validity_date_to, origin, destination, via, charge_type, charge_name, charge_code, carrier
  FROM duplicates
  WHERE row_num > 1
);

ALTER TABLE quotation_local_charges_spottemp
ADD CONSTRAINT quotation_local_charges_spottemp_associate_unique_key UNIQUE (validity_date_from, validity_date_to, origin, destination, via, charge_type, charge_name, charge_code, carrier, export_import);

ALTER TABLE online_rates_spottemp
	ADD CONSTRAINT online_rates_spottemp_associate_unique_key UNIQUE (pol_code, pod_code, via_way_name, carrier_code, etd, eta, vessel_name, voyage);
	

	DROP TABLE companies;

	CREATE TABLE IF NOT EXISTS companies(
		"id" uuid DEFAULT uuid_generate_v1mc(),
		"name" VARCHAR(500),
		"business_type" VARCHAR(500),
		"website" VARCHAR(500),
		"contact_number" VARCHAR(100),
		"country" VARCHAR(500),
		"city" VARCHAR(500),
		"address" VARCHAR(1000),
		"tier" VARCHAR(500),
		"trade_lane" VARCHAR(500),
		"commence_date" DATE,
		"expiry_date" DATE,
		"lead_first_name" VARCHAR(500),
		"lead_last_name" VARCHAR(500),
		"office_phone" VARCHAR(100),
		"title" VARCHAR(500),
		"department" VARCHAR(500),
		"probability" VARCHAR(500),
		"deal_size" VARCHAR(500),
		"stage" VARCHAR(500),
		"closing_date" DATE,
		"deleted" BOOLEAN NOT NULL DEFAULT false,
		"active" BOOLEAN NOT NULL DEFAULT true,
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(500) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(500) NULL,
		PRIMARY KEY(id)
	);

	CREATE TABLE IF NOT EXISTS customer_request (
		"request_id" uuid DEFAULT uuid_generate_v1mc(),
		"requestFor" VARCHAR(500) NOT NULL,
		"cargoReadyDate" TIMESTAMP,
		"tradeLane" VARCHAR(500) NOT NULL,
		"office" VARCHAR(500) NOT NULL,
		"phoneNumber" VARCHAR(500) NOT NULL,
		"email" VARCHAR(500) NOT NULL,
		"accountStatus" VARCHAR(500) NOT NULL,
		"commodity" VARCHAR(500) NOT NULL,
		"hsCode" VARCHAR(500) NOT NULL,
		"equipmentType" VARCHAR(500) NOT NULL,
		"customerBackground" VARCHAR(500) NOT NULL,
		"targetedVolume" VARCHAR(500) NOT NULL,
		"requestedValidity" VARCHAR(500) NOT NULL,
		"presentForwarder" VARCHAR(500) NOT NULL,
		"existingRateBenchmark" VARCHAR(500) NOT NULL,
		"reasonForUsage" VARCHAR(500) NOT NULL,
		"termOfDelivery" VARCHAR(500) NOT NULL,
		"specialRequirements" VARCHAR(500) NOT NULL,
		"portDetails" VARCHAR(500) NOT NULL,
		"haulageMode" VARCHAR(500) NOT NULL,
		"document_name" VARCHAR(500) NOT NULL,
		"file_name" VARCHAR(500) NOT NULL,
		"file_path" VARCHAR(500) NOT NULL,
		"content_type" VARCHAR(500) NOT NULL,
		"file_key" VARCHAR(500) NOT NULL,
		"status" VARCHAR(500) NOT NULL,
		"validity_date" TIMESTAMP,
		"auth_user_id" VARCHAR(500),
		"created_on" TIMESTAMP DEFAULT current_timestamp,
		"created_by" VARCHAR(500) NOT NULL,
		"updated_on" TIMESTAMP,
		"updated_by" VARCHAR(500),
		PRIMARY KEY("request_id")
	);

	ALTER TABLE customer_details ADD IF NOT EXISTS company uuid;

	ALTER TABLE online_rates DROP CONSTRAINT online_rates_associate_unique_key

	CREATE TABLE IF NOT EXISTS demurrage_and_detention_v3(
		"id" uuid DEFAULT uuid_generate_v1mc(),
		"origin" VARCHAR(500),
		"destination" VARCHAR(500),
		"via" VARCHAR(500),
		"carrier" VARCHAR(500),
		"etd" timestamp,
		"eta" timestamp,
		"direction" INTEGER,
		"charge_type" INTEGER,
		"name" VARCHAR(500),
		"commodity" VARCHAR(500),	
		"freetime_start_event" VARCHAR(500),
		"start_day" INTEGER,
		"end_day" INTEGER,
		"currency" VARCHAR(50),
		"cost_per_day_20gp" VARCHAR(100),
		"cost_per_day_40gp" VARCHAR(100),
		"cost_per_day_40hc" VARCHAR(100),
		"cost_per_day_45gp" VARCHAR(100),
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(500) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(500) NULL,
		PRIMARY KEY(id)
	);

	CREATE TABLE IF NOT EXISTS "online_user_timeduration"(
		"id" uuid DEFAULT uuid_generate_v1mc(),
		"userID" VARCHAR(50) NOT NULL,
	    "action" VARCHAR(500) NOT NULL,
	    "time"  TIMESTAMP NOT NULL,
		PRIMARY KEY(id)
	);

	CREATE TABLE IF NOT EXISTS demurrage_and_detention_v3_spottemp(
		"id" uuid DEFAULT uuid_generate_v1mc(),
		"origin" VARCHAR(500),
		"destination" VARCHAR(500),
		"via" VARCHAR(500),
		"carrier" VARCHAR(500),
		"etd" timestamp,
		"eta" timestamp,
		"direction" INTEGER,
		"charge_type" INTEGER,
		"name" VARCHAR(500),
		"commodity" VARCHAR(500),	
		"freetime_start_event" VARCHAR(500),
		"start_day" INTEGER,
		"end_day" INTEGER,
		"currency" VARCHAR(50),
		"cost_per_day_20gp" VARCHAR(100),
		"cost_per_day_40gp" VARCHAR(100),
		"cost_per_day_40hc" VARCHAR(100),
		"cost_per_day_45gp" VARCHAR(100),
		"created_on" TIMESTAMP NULL,
		"created_by" VARCHAR(500) NULL,
		"updated_on" TIMESTAMP NULL,
		"updated_by" VARCHAR(500) NULL,
		PRIMARY KEY(id)
	);

	ALTER TABLE demurrage_and_detention_v3
	ADD CONSTRAINT demurrage_and_detention_v3_associate_unique_key UNIQUE (origin, destination, via, carrier, etd, eta, direction, charge_type, name, commodity, freetime_start_event, start_day, end_day);

	ALTER TABLE demurrage_and_detention_v3_spottemp
	ADD CONSTRAINT demurrage_and_detention_v3_spottemp_associate_unique_key UNIQUE (origin, destination, via, carrier, etd, eta, direction, charge_type, name, commodity, freetime_start_event, start_day, end_day);

`

pool.connect((err, client, done) => {
	client.query(query, (err, res) => {
		console.log(err, res)
		client.end()
		console.log('Table Created Successfully.');
	});
});

module.exports = tool;