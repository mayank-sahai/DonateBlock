/*jshint esversion: 6, multistr: true, node: true*/

"use strict";

// NPM Modules
const _ = require('lodash'),
  // Internal Modules
  config = require('../config'),
  lib = require('../lib'),
  DB = lib.DB,
  vendorDB = lib.vendorDB,
  campaignDB = lib.campaignDB,
  service = lib.service,
  LOG = config.LOG,
  util = require('../util'),
  appConst = util.appConst,
  errorCode = util.errorCode,
  REQUEST = config.REQUEST;

module.exports = {

  apiInfo: (req, res, next) => {

    const body = _.get(req, 'body', {}),
      method = _.get(req, 'method', ''),
      query = _.get(req, 'query', {}),
      url = _.get(req, 'url', '');

    LOG.console.info(method + ": " + url);
    LOG.console.info("Params: ".info, JSON.stringify((method === "POST" || method === "PUT") ? body : query).info);

    return next();

  },

  selectVendor: async (campaign) => {
    try {
      const campaign_data ={ id :campaign._id,
        campaignRequirement : "books" ,//campaign.campaignRequirement,
        quantity : 10,//campaign.quantity,
        amount : 30//campaign.amount_raised;,
      };
      //let vendor = await vendorDB.selectVendor(campaignRequirement, quantity, amount);
      let vendor = await vendorDB.allVendor();
      console.log(vendor);
      var final_vendor_id,i_price=1000000000;
      let v_o = vendor.filter(v => {
        let obj = v.inventory.filter(o => {
          if( o.item == campaign_data.campaignRequirement && o.quantity >= campaign_data.quantity && (o.price * campaign_data.quantity) <= campaign_data.amount){
            return o;
          }
        });
        if((obj[0].price * campaign_data.quantity)<i_price){
          final_vendor_id = v._id;
          i_price = (obj[0].price * campaign_data.quantity);
        }
      })

      await vendorDB.putConsignment(final_vendor_id, campaign_data);

      await campaignDB.addSelectedVendorDetail(campaign_data.id, final_vendor_id);
      return true;
    }
    catch (err) {
      let selectVendorError = {
        status: true,
        error: _.get(errorCode, 648, ''),
        statusCode: 648
      };

      LOG.console.info("ERROR : " + selectVendorError.error); //Adding error in the log file
      _.set(req, ['error'], selectVendorError);
      return next();
    }
  }

};