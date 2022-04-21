var nano = require("nano")("http://admin:4455@db:5984");
var satellite_db = nano.use("satellite_db");
const fs = require("fs");

const resolvers = {
  Query: {
    getAllItems: async () => {
      let queryOptions = {
        reduce: false,
        include_docs: true,
      };
      let doc = await satellite_db.view(
        "satellite_n",
        "all_data_type",
        queryOptions
      );

      return doc.rows.map((n) => n.doc);
    },

    searchItemByName: async (_, args) => {
      const q = {
        selector: {
          _id: { $gt: null },
          name: { $regex: "^" + args.str },
        },
      };
      let doc = await satellite_db.find(q);

      return doc.docs;
    },

    getCountry: async (_, args) => {
      const doc = await satellite_db.get(args.id, { include_docs: true });

      const q = {
        selector: {
          countries: {
            $elemMatch: doc,
          },
        },
      };

      let satellites = await satellite_db.find(q);
      doc.satellites = satellites.docs;
      return doc;
    },

    getSatellite: async (_, args) => {
      const doc = await satellite_db.get(args.id, { include_docs: true });
      return doc;
    },

    getCountriesByPages: async (_, args) => {
      return getItemsByPage(
        "satellite_n",
        "by_country",
        args.page_num,
        args.limit_num
      );
    },

    getSatellitesByPages: async (_, args) => {
      return getItemsByPage(
        "satellite_n",
        "by_satellite",
        args.page_num,
        args.limit_num
      );
    },
  },
  SearchResult: {
    __resolveType(obj) {
      if (obj.type == "country") {
        return "Country";
      }
      if (obj.type == "satellite") {
        return "Satellite";
      }
      return null;
    },
  },

  Mutation: {
    createCountry: async (_, args) => {
      let regexOne = /^([a-zA-Zа-яёА-ЯЁ\- ])+$/;
      const name = args.input.name.trim();
      if (regexOne.test(name)) {
        let data = {
          _id: args.input._id,
          type: "country",
          name: args.input.name,
        };
        let doc = await satellite_db.insert(data, { include_docs: true });
        let new_country = await satellite_db.get(args.input._id, {
          include_docs: true,
        });
        return new_country;
      } else {
        throw new Error("`name` argument must be a string");
      }
    },

    createSatellite: async (_, args) => {
      const q = {
        selector: {
          _id: {
            $or: args.input.country_id,
          },
        },
      };
      let doclist1 = await satellite_db.find(q);

      if (doclist1.docs.length > 0) {
        let data = {
          type: "satellite",
          name: args.input.name,
          countries: doclist1.docs,
        };

        let doc = await satellite_db.insert(data, args.input._id);
        return doc;
      }
    },

    deleteCountry: async (_, args) => {
      satellite_db.get(args.input._id).then((country) => {
        satellite_db
          .destroy(args.input._id, args.input._rev)
          .then((deleted_country) => {
            const q = {
              selector: {
                countries: {
                  $elemMatch: country,
                },
              },
            };

            satellite_db.find(q).then((satellites) => {
              satellites.docs.map(async (satellite) => {
                let new_countries_set = satellite.countries.filter(
                  (n, i) => n._id != args.input._id
                );
                if (new_countries_set.length == 0) {
                  satellite_db
                    .destroy(satellite._id, satellite._rev)
                    .then((d) => console.log(d))
                    .catch((err) => console.log(err));
                } else {
                  let new_data = {
                    _id: satellite._id,
                    _rev: satellite._rev,
                    type: satellite.type,
                    name: satellite.name,
                    countries: new_countries_set,
                  };
                  let doc = await satellite_db.insert(new_data);
                }
              });
            });
          });

        return country;
      });
    },

    deleteSatellite: async (_, args) => {
      satellite_db.get(args.input._id).then((satellite) => {
        satellite_db
          .destroy(args.input._id, args.input._rev)
          .then((deleted_sat) => deleted_sat);
      });
    },
  },
};

async function getItemsByPage(
  view_family_name,
  view_name,
  page_num,
  limit_num
) {
  const queryOptions = {
    reduce: false,
    limit: limit_num,
    skip: (page_num - 1) * limit_num,
    include_docs: true,
  };

  const doclist = await satellite_db.view(
    view_family_name,
    view_name,
    queryOptions
  );
  let temp = [];
  for (let i of doclist.rows) {
    let obj = i.doc;
    obj.count = doclist.total_rows;
    temp.push(obj);
  }
  return temp;
}

module.exports = resolvers;
