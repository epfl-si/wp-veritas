// Connection string: mongodb://username:password@host/database

// Sources
exports.PROD_DB_HOST = "XXX";
exports.PROD_DB_USERNAME = "wp-veritas";
exports.PROD_DB_PWD = process.env.WP_VERITAS_DB_PASSWORD_PROD;
exports.PROD_DB_NAME = "wp-veritas";

exports.TEST_DB_HOST = "XXX";
exports.TEST_DB_USERNAME = "wp-veritas-test";
exports.TEST_DB_PWD = process.env.WP_VERITAS_DB_PASSWORD_TEST;
exports.TEST_DB_NAME = "wp-veritas-test";

exports.DEV_DB_HOST = "XXX";
exports.DEV_DB_USERNAME = "wp-veritas";
exports.DEV_DB_PWD = process.env.WP_VERITAS_DB_PASSWORD_DEV;
exports.DEV_DB_NAME = "wp-veritas";

// Local target (configurable in case you are using another installation of
// mongodb, e.g. inside a docker container)
exports.LOCAL_TARGET_TEST_DB_HOST = "mongo";
exports.LOCAL_TARGET_TEST_DB_PORT = "27017";
// If outside a Docker container (i.e. make meteor) you may want to use
// something like below instead.
//exports.LOCAL_TARGET_TEST_DB_HOST = "localhost";
//exports.LOCAL_TARGET_TEST_DB_PORT = "3001";

// e.g. /home/user/wp-veritas
exports.WORKSPACE_PATH = "/src";