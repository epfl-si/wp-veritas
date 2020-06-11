// Connection string: mongodb://username:password@host:port/database


// Sources
exports.PROD_DB_HOST = "XXX";
exports.PROD_DB_USERNAME = "wp-veritas";
exports.PROD_DB_PWD = "XXX";
exports.PROD_DB_NAME = "wp-veritas";

exports.TEST_DB_HOST = "XXX";
exports.TEST_DB_USERNAME = "wp-veritas";
exports.TEST_DB_PWD = "XXX";
exports.TEST_DB_NAME = "wp-veritas";

// Local target (configurable in case you are using another installation of
// mongodb, e.g. inside a docker container)
exports.LOCAL_TARGET_TEST_DB_HOST = "mongo";
exports.LOCAL_TARGET_TEST_DB_PORT = "27017";

// e.g. /home/user/wp-veritas
exports.WORKSPACE_PATH = "/src";