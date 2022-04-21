var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
var nano = require("nano")("http://admin:4455@db:5984");
var satellite_db = nano.use("satellite_db");
const { graphqlHTTP } = require("express-graphql");
const schema = require("../schema");
const resolvers = require("../resolvers");
const fs = require("fs");
const { makeExecutableSchema } = require("@graphql-tools/schema");
const { GraphQLObjectType, GraphQLList, GraphQLInt, GraphQLError, } = require("graphql");
const hbs = require("hbs");
const app = express();
app.use(express.static(__dirname + "../public"));
app.set("view engine", "html");
app.engine("html", require("hbs").__express);
const temp = () => __awaiter(this, void 0, void 0, function* () {
    const dblist = yield nano.db.list();
    const doclist = yield satellite_db.list({ include_docs: true });
});
temp();
app.use("/graphql", graphqlHTTP({
    graphiql: true,
    schema: makeExecutableSchema({
        typeDefs: schema,
        resolvers: resolvers,
    }),
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get("/", function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        res.render("index");
    });
});
app.listen(5000);
//# sourceMappingURL=app.js.map