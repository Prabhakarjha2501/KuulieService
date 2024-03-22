require('dotenv').config();
const pug = require('pug');
const Path = require('path');
const logger = require('../../logger/logger');
const executeQuery = require('../../db/connect');
const { OK, INTERNAL_SERVER_ERROR } = require('../../utils/apiStatus');
const csvParser = require('csv-parser');
const moment = require('moment')
const { getClientDataById } = require('../../utils/redis-service');
const axios = require('axios');

const fetchCustomerDetails = async (req, res) => {

    const query = `select * from customer_details`;

    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            let tutorials = [{ id: 10, title: 20, description: 20, published: 200 }]
            const csvFields = ["Id", "Title", "Description", "Published"];
            const csvParserDate = new csvParser({ csvFields });
            const csvData = csvParserDate.parse(tutorials);

            res.set("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", "attachment; filename=tutorials.csv");

            res.status(200).end(csvData);
            // res.status(OK).send({ data, message: 'customer data fetched.' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const createUserFromAdmin = async (req, res) => {
    const {
        auth_user_id,
        first_name,
        last_name,
        license_type
    } = req.body;
    const created_by_id = req.user.id;
    const clientId = req.headers['client-id'];

    if (!clientId) {
        logger.error("client-id is required");
        return res.status(400).send();
    }
    const client = await getClientDataById(clientId);
    if (!client || !client.dbConnectionString) {
        logger.error("No client information available");
        return res.status(500).send("No client information available.");
    }
    const dbConnectionString = client.dbConnectionString;

    const query = `INSERT INTO "user_details" ("auth_user_id", "first_name", "last_name", "license_type", "created_by", "created_on", "updated_by", "updated_on") 
    VALUES ('${auth_user_id}', '${first_name}', '${last_name}', '${license_type}', '${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', '${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}') RETURNING "user_id";`;
    try {
        const isUserCreated = await executeQuery(query, dbConnectionString);
        const userr_id = isUserCreated.rows[0].user_id;
        const query2 = `INSERT INTO "user_roles" ("user_id", "role_id", "created_by", "created_on", "updated_by", "updated_on") VALUES 
            ('${userr_id}', (select "role_id" from "roles" where name='${license_type === 'SUPERUSER' ? 'admin' : license_type.toLowerCase()}'),'${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', '${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}');`;
        const roleinserted = await executeQuery(query2, dbConnectionString);
        res.status(200).send({ data: isUserCreated, message: 'User created successfully' });

    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const updateUserFromAdmin = async (req, res) => {
    const {
        first_name,
        last_name,
        license_type
    } = req.body;
    const authUserId = req.params.authUserId;
    const updated_by_id = req.user.id;
    const clientId = req.headers['client-id'];

    if (!clientId) {
        logger.error("client-id is required");
        return res.status(400).send();
    }
    const client = await getClientDataById(clientId);
    if (!client || !client.dbConnectionString) {
        logger.error("No client information available");
        return res.status(500).send("No client information available.");
    }
    const dbConnectionString = client.dbConnectionString;
    const query = `UPDATE "user_details" 
                    SET 
                    "first_name" = '${first_name}',
                    "last_name" = '${last_name}',
                    "updated_by" = '${updated_by_id}',
                    "license_type" = '${license_type}',
                    "updated_on" = '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}' WHERE auth_user_id = '${authUserId}'`;
    try {
        return executeQuery(query, dbConnectionString).then((data) => {
            res.status(200).send({ data, message: 'User updated successfully' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const createUser = async (req, res) => {
    try {
        const { email, first_name, last_name, company_name, country, city, user_department, roleList, contact_no } = req.body;
        const license_type = roleList?.split(",")[0];
        const created_by_id = req.user.id;
        const createUserAtAdminPortal = await axios.post(`${process.env.AUTH_API_URL}/api/users/create/from-clients-portal`, { email: email, isActive: true, role: license_type },
            { headers: { Authorization: req.headers.authorization } });
        if (createUserAtAdminPortal?.status == 201) {
            const { id } = createUserAtAdminPortal.data;
            const query = `INSERT INTO "user_details" ("auth_user_id", "first_name", 
            "last_name", "license_type","company_name","country","city","user_department" ,"created_by",
             "created_on", "updated_by", "updated_on", "contact_no") 
                VALUES ('${id}', '${first_name}', '${last_name}', '${license_type}','${company_name}',
               '${country}','${city}','${user_department}','${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', '${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', '${contact_no}') RETURNING "user_id";`;
            const isCreated = await executeQuery(query, req.dbConnectionString);
            req.body.user_id = isCreated.rows[0].user_id;
            /*
            Role is actually licenseType here.
            const userRolesInsertQuery = generateUserRolesInsertQuery(req, res, true);
            const isRolesAdded = await executeQuery(userRolesInsertQuery, req.dbConnectionString);
            */
            const sendInitializeEmail = await axios.post(`${process.env.AUTH_API_URL}/api/users/email/initialize`,
                { userId: id }, { headers: { Authorization: req.headers.authorization } })
            if (sendInitializeEmail.data.success) {
                res.status(200).send({ message: 'User created successfully' });
            }
            res.status(200).send({ message: 'User created successfully' });
        }
        else {
            res.status(INTERNAL_SERVER_ERROR).send(createUserAtAdminPortal);
        }
    } catch (err) {
        if (err.response && err.response.status === 400) {
            res.status(400).send({ message: 'Duplicate email' });
        } else {
            res.status(INTERNAL_SERVER_ERROR).send(err);
        }
    }
}

const updateUser = async (req, res) => {
    const {
        first_name,
        last_name,
        email,
        roleList,
        company_name,
        country,
        city,
        user_department,
        user_id,
        contact_no,
        auth_user_id
    } = req.body;

    const license_type = roleList?.split(",")[0];
    const updated_by_id = req.user.id;
    const clientId = req.user.client.id;

    const query = `UPDATE "user_details" 
                SET 
                "first_name" = '${first_name}',
                "last_name" = '${last_name}',
                "company_name" = '${company_name}',
                "country" = '${country}',
                "city" = '${city}',
                "user_department" = '${user_department}',
                "contact_no" = '${contact_no}',
                "license_type" = '${license_type}',
                "updated_by" = '${updated_by_id}',
                "updated_on" = '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}' WHERE user_id = '${user_id}'`;
    try {
        const updateUserAtAdminPortal = await axios.put(`${process.env.AUTH_API_URL}/api/users/${auth_user_id}`, {
            role: license_type,
            clientId,
            email,
            firstName: first_name,
            lastName: last_name,
            client: clientId,
            isActive: true
        },
            { headers: { Authorization: req.headers.authorization } });
        const updateUser = await executeQuery(query, req.dbConnectionString);

        /*
        Update license_type as role in AuthDB
        const userRolesUpdateQuery = generateUserRolesInsertQuery(req, res, false);
        const updateRoles = await executeQuery(userRolesUpdateQuery, req.dbConnectionString);
        */
        res.status(200).send({ message: 'User updated successfully' });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }

}

const updateMyProfile = async (req, res) => {
    const {
        first_name,
        last_name,
        email,
        contact_no
    } = req.body;
    const user_id = req.user.id;
    const query = `UPDATE "user_details" 
                SET 
                "first_name" = '${first_name}',
                "last_name" = '${last_name}',
                "contact_no" = '${contact_no}',
                "updated_by" = '${user_id}',
                "updated_on" = '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}' WHERE auth_user_id = '${user_id}'`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(200).send({ message: 'Profile updated successfully' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const getUserById = async (req, res) => {
    const {
        user_id
    } = req.body;

    const query = `select * from "user_details" WHERE "user_id" = '${user_id}'`;
    try {
        const userDetailsByClientPortal = await executeQuery(query, req.dbConnectionString);
        const userIds = (userDetailsByClientPortal?.rows.map((u) => u.auth_user_id)).toString()
        const userDetailsByAdminPortal = await axios.get(`${process.env.AUTH_API_URL}/api/users/by-userids/from-client-portal`,
            { headers: { Authorization: req.headers.authorization, userids: userIds } });
        const data = userDetailsByClientPortal?.rows.map((u, i) => { if (u.auth_user_id == userDetailsByAdminPortal.data[i].id) return { ...u, email: userDetailsByAdminPortal.data[i].email } })
        res.status(200).send({ data: data, message: `User By Id` });
    } catch (err) {
        console.error(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const getAllUser = async (req, res) => {
    const query = `select * from "user_details" ORDER BY created_on DESC`;
    try {
        const userDetailsByClientPortal = await executeQuery(query, req.dbConnectionString);
        const userIds = (userDetailsByClientPortal?.rows.map((u) => u.auth_user_id)).toString()
        const userDetailsByAdminPortal = await axios.get(`${process.env.AUTH_API_URL}/api/users/by-userids/from-client-portal`,
            { headers: { Authorization: req.headers.authorization, userids: userIds } });
        const data = userDetailsByClientPortal?.rows.map((u, i) => {
            const authUser = userDetailsByAdminPortal?.data?.find((authUser) => u.auth_user_id === authUser.id);
            return { ...u, email: authUser?.email }
        })
        res.status(200).send({ data: data, message: "Get users" });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const getAllUsersByCreatedById = async (req, res) => {
    let query;
    if (req.user.role === 'ADMIN') {
        query = `SELECT * FROM "user_details" WHERE license_type != 'ADMIN' ORDER BY updated_on DESC`;
    } else {
        const created_by_id = req.user.id;
        query = `SELECT * FROM "user_details" WHERE created_by = '${created_by_id}' ORDER BY updated_on DESC`;
    }
    try {
        const userDetailsByClientPortal = await executeQuery(query, req.dbConnectionString);

        const userIds = (userDetailsByClientPortal?.rows.map((u) => u.auth_user_id)).toString();
        const authUserIds = userIds.split(",").reduce((acc, userId) => {
            if (acc === "") {
                acc = `'${userId}'`;
            } else {
                acc += `,'${userId}'`;
            }
            return acc;
        }, "");
        // const rolesQuery = `SELECT r.role_id, r.name, ud.user_id, ud.auth_user_id, ud.contact_no FROM user_details ud INNER JOIN 
        //                     user_roles ur ON ud.user_id::text = ur.user_id::text INNER JOIN
        //                     roles r ON ur.role_id::text = r.role_id::text    
        //                     WHERE ud.auth_user_id::text IN (${authUserIds});`;
        // const userRoles = await executeQuery(rolesQuery, req.dbConnectionString);
        const userDetailsByAdminPortal = await axios.get(`${process.env.AUTH_API_URL}/api/users/by-userids/from-client-portal`,
            { headers: { Authorization: req.headers.authorization, userids: userIds } });

        const clientDBUsers = userDetailsByAdminPortal?.data?.filter(user => user.isActive).map((user) => {
            const clientDBUser = userDetailsByClientPortal.rows?.find(row => row.auth_user_id == user.id) || {};
            return {
                ...clientDBUser,
                email: user.email,
                roleList: [{ role_id: clientDBUser.license_type }]
            }
        });
        res.status(200).send({ data: clientDBUsers, message: 'User List' });
    } catch (err) {
        console.log(err);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const getUsersByClientIdAndAuthUserIds = async (req, res) => {
    const clientId = req.headers['client-id'];
    const authUserIds = req.headers['auth-user-ids'].split(",").reduce((acc, userId) => {
        if (acc === "") {
            acc = `'${userId}'`;
        } else {
            acc += `,'${userId}'`;
        }
        return acc;
    }, "");
    if (!clientId || !authUserIds || authUserIds.length === 0) {
        logger.error("Bad request");
        return res.status(400).send();
    }
    const client = await getClientDataById(clientId);
    if (!client || !client.dbConnectionString) {
        logger.error("No client information available");
        return res.status(500).send("No client information available.");
    }
    const dbConnectionString = client.dbConnectionString;
    try {
        const userQuery = `select * from "user_details" where auth_user_id IN (${authUserIds})`;
        const userData = await executeQuery(userQuery, dbConnectionString);
        const customerQuery = `select * from "customer_details" where auth_user_id IN (${authUserIds})`;
        const customerData = await executeQuery(customerQuery, dbConnectionString);
        let data = userData.rows;
        data = data?.length > 0 ? [...data, ...customerData.rows] : customerData.rows;
        res.status(200).send({ data, message: 'User List' });
    } catch (err) {
        logger.error(`Error while fetching user details ${err}`);
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const createRole = async (req, res) => {
    const { name } = req.body;
    const created_by_id = req.user.id;

    const isTrue = true;

    const query = `INSERT INTO "roles" ("name", "created_by", "created_on", "updated_by", "updated_on", "is_active") 
    VALUES ('${name}', '${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', '${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', '${isTrue}')`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(200).send({ data, message: 'Role created successfully' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const updateRole = async (req, res) => {
    const {
        role_id,
        name,
        is_active
    } = req.body;

    const updated_by_id = req.user.id;

    const query = `UPDATE "roles" 
                SET 
                "name" = '${name}',
                "updated_by" = '${updated_by_id}',
                "updated_on" = '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}',
                "is_active" = '${is_active}' WHERE role_id = '${role_id}'`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(200).send({ data, message: 'Role updated successfully' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const getAllRoles = async (req, res) => {
    const query = `select * from "roles" where is_active`
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(200).send({ data: data.rows, message: 'Roles List' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const createPermission = async (req, res) => {
    const { name, ref_value } = req.body;

    const created_by_id = req.user.id;
    const isTrue = true;

    const query = `INSERT INTO "permissions" ("name", "ref_value", "created_by", "created_on", "updated_by", "updated_on", "is_active") 
    VALUES ('${name}', '${ref_value}','${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', '${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', '${isTrue}')`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(200).send({ data, message: 'Permission created successfully' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const updatePermission = async (req, res) => {
    const {
        permission_id,
        name,
        ref_value,
        is_active
    } = req.body;

    const updated_by_id = req.user.id;

    const query = `UPDATE "permissions" 
                SET 
                "name" = '${name}',
                "ref_value" = '${ref_value}',
                "updated_by" = '${updated_by_id}',
                "updated_on" = '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}',
                "is_active" = '${is_active}' WHERE permission_id = '${permission_id}'`;

    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(200).send({ data, message: 'Permission updated successfully' });
        })
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const getAllPermissions = async (req, res) => {
    const query = `select * from "permissions" where is_active`
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(200).send({ data: data.rows, message: 'Permissions List' });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const addUserRoles = async (req, res) => {
    const query = generateUserRolesInsertQuery(req, res, true);
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(200).send({ data, message: `User Role(s) added successfully` });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const updateUserRoles = async (req, res) => {
    const query = generateUserRolesInsertQuery(req, res, false);
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(200).send({ data, message: `User Role(s) updated successfully` });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const getUserRolesById = async (req, res) => {
    const user_id = req.user.id;
    const query = `SELECT distinct(pr.ref_value) as permissions FROM user_details ud INNER JOIN 
    user_roles ur ON ud.user_id::text = ur.user_id::text INNER JOIN
    roles r ON ur.role_id::text = r.role_id::text INNER JOIN
    roles_permission rp ON rp.role_id::text = r.role_id::text INNER JOIN
    permissions pr ON rp.permission_id::text = pr.permission_id::text
    WHERE ud.auth_user_id::text = '${user_id}';`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(200).send({ data: data.rows, message: `User Role(s) By Id` });
        })
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const generateUserRolesInsertQuery = (req, res, isCreate) => {
    const {
        user_id,
        roleList,
    } = req.body;

    const created_by_id = req.user.id;
    let roles = roleList.split(',');
    if (isCreate) {
        let query = `INSERT INTO "user_roles" ("user_id", "role_id", "created_by", "created_on", "updated_by", "updated_on") VALUES `;
        let values = '';
        if (roleList.length > 0 && roles.length > 0) {
            for (i = 0; i < roles.length; i++) {
                values += `('${user_id}', '${roles[i]}', '${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', '${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}'),`;
            }
        } else {
            res.status(INTERNAL_SERVER_ERROR).send({ message: 'Roles should not be empty.' });
        }
        return query = query + values.substring(0, values.length - 1);
    }
    else {
        let query = `DELETE FROM "user_roles" WHERE "user_id" = '${user_id}'; INSERT INTO "user_roles" ("user_id", "role_id", "created_by", "created_on", "updated_by", "updated_on") VALUES `;
        let values = '';

        if (roleList.length > 0 && roles.length > 0) {
            for (i = 0; i < roles.length; i++) {
                values += `('${user_id}', '${roles[i]}', '${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', '${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}'),`;
            }
            query = query + values.substring(0, values.length - 1);
        } else {
            query = `DELETE FROM "user_roles" WHERE "user_id" = '${user_id}'`;
        }
        return query;
    }
}

const addRolesWithPermission = async (req, res) => {
    const query = generateRolesWithPermissionInsertQuery(req, res, true);
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(200).send({ data, message: `Role Permission(s) added successfully` });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const updateRolesWithPermission = async (req, res) => {
    const query = generateRolesWithPermissionInsertQuery(req, res, false);
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(200).send({ data, message: `Role Permission(s) updated successfully` });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const getRolesWithPermissionById = async (req, res) => {
    const {
        role_id
    } = req.body;

    const query = `select * from "roles_permission" WHERE "role_id" = '${role_id}'`;
    try {
        return executeQuery(query, req.dbConnectionString).then((data) => {
            res.status(200).send({ data: data.rows, message: `User Role(s) By Id` });
        });
    } catch (err) {
        res.status(INTERNAL_SERVER_ERROR).send({ message: err });
    }
}

const generateRolesWithPermissionInsertQuery = (req, res, isCreate) => {
    const {
        role_id,
        permission_id,
    } = req.body;

    const created_by_id = req.user.id;
    const permissionList = permission_id.split(',')
    if (isCreate) {
        let query = `INSERT INTO "roles_permission" ("role_id", "permission_id", "created_by", "created_on", "updated_by", "updated_on") VALUES `;
        let values = '';
        if (permission_id.length > 0 && permissionList.length > 0) {
            for (i = 0; i < permissionList.length; i++) {
                values += `('${role_id}', '${permissionList[i]}', '${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', '${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}'),`;
            }
        } else {
            res.status(INTERNAL_SERVER_ERROR).send({ message: 'Roles should not be empty.' });
        }
        return query = query + values.substring(0, values.length - 1);
    }
    else {
        const query = `DELETE FROM "roles_permission" WHERE "role_id" = '${role_id}'; INSERT INTO "roles_permission" ("role_id", "permission_id", "created_by", "created_on", "updated_by", "updated_on") VALUES `;
        let values = '';

        if (permission_id.length > 0 && permissionList.length > 0) {
            for (i = 0; i < permissionList.length; i++) {
                values += `('${role_id}', '${permissionList[i]}', '${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}', '${created_by_id}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}'),`;
            }
            query = query + values.substring(0, values.length - 1);
        } else {
            query = `DELETE FROM "roles_permission" WHERE "role_id" = '${role_id}'`;
        }
        return query;
    }
}

module.exports = {
    fetchCustomerDetails: fetchCustomerDetails,
    createUserFromAdmin,
    updateUserFromAdmin,
    createUser,
    updateUser,
    updateMyProfile,
    getUserById,
    getAllUser,
    getUsersByClientIdAndAuthUserIds,
    createRole,
    updateRole,
    getAllRoles,
    createPermission,
    updatePermission,
    getAllPermissions,
    addUserRoles,
    updateUserRoles,
    getUserRolesById,
    addRolesWithPermission,
    updateRolesWithPermission,
    getRolesWithPermissionById,
    getAllUsersByCreatedById
};