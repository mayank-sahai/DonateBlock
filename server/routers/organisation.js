/*jshint esversion: 6, multistr: true, node: true*/

"use strict";

// NPM Modules
const _                   =   require('lodash'),
      multer              =   require('multer'),
      request             =   require('request'),
      jwt                 =   require('jsonwebtoken'),
// Internal Modules
      config              =   require('../config'),
      wallet              =   config.wallet,
      lib                 =   require('../lib'),
      util                =   require('../util'),
      deployCon           =   require('./deploy'),
      organisationDB      =   lib.organisationDB,
      campaignDB          =   lib.campaignDB,
      service             =   lib.service,
      LOG                 =   config.LOG,
      appConst            =   util.appConst,
      errorCode           =   util.errorCode,
      REQUEST             =   config.REQUEST;

// const compiledFactory = require('../../ethereum/build/CampaignFactory.json');
//let abi = compiledFactory.interface;
const abi = [
	{
		"constant": true,
		"inputs": [],
		"name": "organization",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "value",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "vendorAddress",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"name": "donors",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "complete",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "recipient",
				"type": "address"
			},
			{
				"name": "val",
				"type": "uint256"
			},
			{
				"name": "completed",
				"type": "uint256"
			}
		],
		"name": "payVendor",
		"outputs": [],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "amountRequired",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [],
		"name": "donate",
		"outputs": [],
		"payable": true,
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "findVendor",
		"outputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"name": "aim",
				"type": "uint256"
			},
			{
				"name": "org",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "constructor"
	}
];
const factoryabi = [
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"name": "deployedCampaigns",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "getAllCampaigns",
		"outputs": [
			{
				"name": "",
				"type": "address[]"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": false,
		"inputs": [
			{
				"name": "aim",
				"type": "uint256"
			}
		],
		"name": "createCampaign",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	}
];
const ethers = require('ethers');
let provider = ethers.getDefaultProvider('rinkeby');
let CampaignFactoryAddress = '0x9ccf200EdbBDf5eA09477CbF231079D675238D6B';




module.exports  = {

  registerOrganisation: async (req, res, next) => {

    try{

      if ( _.get(req, ['error', 'status'], false) )
      {
        return next();
      }

      let wallet_data = await wallet.generate();

      const db_details = {
        orgName        :   _.get(req,['body','orgName'],''),
        orgEmail       :   _.get(req,['body','orgEmail'],''),
        orgPhone       :   _.get(req,['body','orgPhone'],''),
        isd_code       :   _.get(req,['body','isd_code'],''),
        orgPassword    : /*service.encrypt(*/_.get(req, ['body', 'orgPassword'], '')/*)*/,
        orgRegId       :   _.get(req,['body','orgRegId'],''),
        orgAddress     :   _.get(req,['body','orgAddress'],''),
        orgOwnerName   :   _.get(req,['body','orgOwnerName'],''),
        orgWalletAddress  :    wallet_data.address ,
        orgPrivateKey  :    wallet_data.privateKey,
        orgPublicKey   :    wallet_data.publicKey,
      };

      if(!db_details.orgName || !db_details.orgPhone || !db_details.orgPassword  || !db_details.orgRegId){
        
        let invalidDetailError = {
          status: true,
          error: _.get(errorCode, 601, ''),
          statusCode: 601
        };

        LOG.console.info("ERROR : " + invalidDetailError.error); //Adding error in the log file
        _.set(req, 'error', invalidDetailError);
        return next();
      }

    
      let details  = await organisationDB.registerOrganisation(db_details);//Adding a new verified Organisation in organisationDB

      if(!details)
      {          // error: "Error in adding new verified Organisation to the db",
        let invalidOrganisationError = {
          status: true,
          error: _.get(errorCode, 628, ''),
          statusCode: 628
        };

        LOG.console.info("ERROR : " + invalidOrganisationError.error); //Adding error in the log file
        _.set(req, 'error', invalidOrganisationError);
        return next();

      }

      _.set(req, ['body'], {});
      _.set(req, ['body'], details);
     
      return next();

    }
    catch(error) {
        // error:"organisationDB Error" ,
      let hlError =   {
        status: true,
        error: _.get(errorCode, 603, ''),
        statusCode: 603
      };

      _.set(req, ['error'], hlError);
      return next();

    }
  },


  checkOrganisationLogin: async (req, res, next) => {

    try {

      if ( _.get(req, ['error', 'status'], false) ) {

        return next();
      }

      const orgPhone                 = _.get(req, ['body', 'orgPhone'], 0),
            isd_code              = _.get(req, ['body', 'isd_code'], 0),
            orgPassword              = _.get(req, ['body', 'orgPassword'], '');

      if(!orgPhone || !orgPassword || !isd_code)//phone, password and isd code are compulsory
      {
        let organisationError = {
          status: true,
          error: _.get(errorCode, 604, ''),
          statusCode: 604

        };

        LOG.console.info("ERROR : " + organisationError.error); //Adding error in the log file
        _.set(req, ['error'], organisationError);
        return next();
      }

    //Checking the Organisation in db, based on the credentials
      let details = await organisationDB.checkOrganisationLogin( orgPhone , orgPassword );

      if (!details)
      {
        // error: 'Invalid credentials'
        let dbError = {
          status: true,
          error: _.get(errorCode, 605, ''),
          statusCode: 605
        };

        LOG.console.info("ERROR : " + dbError.error); //Adding error in the log file
        _.set(req, ['error'], dbError);
        return next();

      }
      
      if(details.isd_code != isd_code){

        // error: 'Invalid isd_code'
        let dbError = {
          status: true,
          error: _.get(errorCode, 639, ''),
          statusCode: 639
        };

        LOG.console.info("ERROR : " + dbError.error); //Adding error in the log file
        _.set(req, ['error'], dbError);
        return next();

      }

      let token = await jwt.sign({ organisation_id: details._id, time: new Date().getTime() }, appConst.secret_key);//generating token

      let updatedDetails = await organisationDB.addTokenForVerifiedOrganisation( details._id, token);//adding session token for the Organisation in db

      if (!updatedDetails)
      {
        // error: "Error while adding session token in db"
        let dbError = {
          status: true,
          error: _.get(errorCode, 629, ''),
          statusCode: 629
        };

        LOG.console.info("ERROR : " + dbError.error); //Adding error in the log file
        _.set(req, ['error'], dbError);
        return next();

      }

      _.set(req, ['body'], {});
      _.set(req, ['body', 'auth'], true);
      _.set(req, ['body', 'access_token'], token);
      _.set(req, ['body', 'organisation_id'], details._id);
      _.set(req, ['body', 'orgName'], details.orgName);

      return next();

    } catch (error) {

      console.log('error',error);
      let hlError =   {
        status: true,
        error: _.get(errorCode, 641, ''),
        statusCode: 641
      };

      LOG.console.info("ERROR : " + hlError.error); //Adding error in the log file
      _.set(req, ['error'], hlError);
      return next();

    }

  },


//--------------------api to verify the session token---------------
  verifyOrganisationToken: async (req, res, next) => {

    if(_.get(req, ['error', 'status'], false) ){

      return next();
    }

    try{

      let token = req.headers['x-access-token'];

      if(!token)
      {
        // error: 'Token missing!',
        let tokenError = {
          status: true,
          error: _.get(errorCode, 606, ''),
          statusCode: 606
        };

        LOG.console.info("ERROR : " + tokenError.error); //Adding error in the log file
        _.set(req, ['error'], tokenError);
        return next();

      }

      let decodedId = await jwt.verify(token, appConst.secret_key);//verifying the session token

      let details = await organisationDB.organisationDetails( decodedId.organisation_id );//Getting Organisation details based on id from db

      if(!details)
      {
        // "Error in getting Organisation details from the db" ,
        let organisationError = {
          status: true,
          error: _.get(errorCode, 608, ''),
          statusCode: 608
        };

        LOG.console.info("ERROR : " + organisationError.error); //Adding error in the log file
        _.set(req, ['error'], organisationError);
        return next();

      }

      if(details.token == token)
      {
        _.set(req, ['body','organisation_id'], decodedId.organisation_id );//token verified via db
        return next();

      }
      if(!details.token)
      {
        //'Organisation not logged in'
        let organisationError = {
          status: true,
          error: _.get(errorCode, 623, ''),
          statusCode: 623
        };

        LOG.console.info("ERROR : " + organisationError.error); //Adding error in the log file
        _.set(req, ['error'], organisationError);
        return next();

      }

      //'Organisation logged in on another device:Token mismatch'
      let tokenError = {
        status: true,
        error: _.get(errorCode, 607, ''),
        statusCode: 607
      };

      LOG.console.info("ERROR : " + tokenError.error); //Adding error in the log file
      _.set(req, ['error'], tokenError);
      return next();

    }
    catch(error){
      // 'Failed to authenticate token.
      let token_error = {
        status: true,
        error: _.get(errorCode, 609, ''),
        statusCode: 609
      }

      LOG.console.info("ERROR : " + token_error.error); //Adding error in the log file
      _.set(req,['error'], token_error );
      return next();

    }
  },


//--------api to get details of the active Organisation------------------
  getOrganisationDetails: async (req, res, next) => {

    try {

      if ( _.get(req, ['error', 'status'], false) )
      {
        return next();
      }

      const organisation_id  = _.get(req, ['body', 'organisation_id'], '');
      let organisation_data = await organisationDB.organisationDetails(organisation_id);
      _.set(req, ['body','organisation_details'], organisation_data );
      return next();

    }
    catch(error)
    {
      // 'Error while getting Organisation details',
      let organisationError = {
        status: true,
        error: _.get(errorCode, 642, ''),
        statusCode: 642
      };

      LOG.console.info("ERROR : " + organisationError.error); //Adding error in the log file
      _.set(req, ['error'], organisationError);
      return next();

    }

  },


  getOrganisationWallet: async (req, res, next) => {
    try {

      if ( _.get(req, ['error', 'status'], false) )
      {
        return next();
      }

      const organisation_id  = _.get(req, ['body', 'organisation_id'], '');

      if(!organisation_id)
      {
        // 'id missing!',
        let userError = {
          status: true,
          error: _.get(errorCode, 610, ''),
          statusCode: 610
        };

        LOG.console.info("ERROR : " + userError.error); //Adding error in the log file
        _.set(req, ['error'], userError);
        return next();
      }

      let details = await organisationDB.getOrganisationWallet(organisation_id);


      _.set(req, ['body'], {});
      _.set(req, ['body', 'wallet'], details);
     

      return next();

    } catch(error) {
     //Error while getting user details
      let userError = {
        status: true,
        error: _. get(errorCode, 652, ''),
        statusCode: 652
      };

      LOG.console.info("ERROR : " + userError.result.error.message); //Adding error in the log file
      _.set(req, 'error', userError);
      return next();

    }
  },


//--------api to upload profile picture------------------
organisationProfilePicUpload: async (req,res,next) => {

    if( _.get(req, ['error', 'status'], false) ){
      return next();
    }

    const organisation_id = _.get(req, ['body', 'organisation_id'], '');

    let path  = './public/images/uploads/'+organisation_id;
    let result  = await organisationDB.addProfilePath(organisation_id, path);

    if(!result)
    {
      'Error while adding profile pic path in db'
      let picError = {
        status: true,
        error: _.get(errorCode, 632, ''),
        statusCode: 632
    };

       LOG.console.info("ERROR : " + picError.error); //Adding error in the log file
      _.set(req, ['error'], picError);
      return next();

    }

    service.upload(req, res, (err) => {
      if ( err ) {
        //unable to upload pic error
        console.log(err);
        let picError = {
          status: true,
          error: 'error in uploading picture',
          statusCode: 631
        };

        LOG.console.info("ERROR : " + picError.error); //Adding error in the log file
        _.set(req, ['error'], picError);
        return next();
      }
    });

    const new_details = {
          profile_pic       :   path
    };

    _.set(new_details,['organisation_id'], organisation_id);

    var details    =    {file_uploaded: true};

    _.set(req, ['body'], {});
    _.set(req, ['body'], details);
    return next();

  },


  createCampaign: async (req,res,next)=>{
    try{


      if ( _.get(req, ['error', 'status'], false) )
      {
        return next();
      }
      const organisation_id  = _.get(req, ['body', 'organisation_id'], '');
      let organisation_details = await organisationDB.organisationDetails(organisation_id);
      let wallet = new ethers.Wallet(organisation_details.orgPrivateKey,provider);
      let contract = new ethers.Contract(CampaignFactoryAddress, factoryabi, provider);
      let contractWithSigner = contract.connect(wallet);
      //let contractWithSigner = new ethers.Contract(CampaignFactoryAddress, factoryabi, wallet);
      let aim = parseInt(_.get(req,['body','amount_required'],100));
      let campaign_address = await contractWithSigner.functions.createCampaign(aim);
      let deployedCampaigns = await contract.functions.getAllCampaigns();
      let len = deployedCampaigns.length;
      let deployedCampaignAddress = deployedCampaigns[len-1];
      
      const db_details = {

        campaignName         :   _.get(req,['body','campaignName'],''),
        campaignCause        :   _.get(req,['body','campaignCause'],''),
        campaignOrganisation :   organisation_id,
        campaignDiscription  :   _.get(req,['body','campaignDiscription'],''),
        amount_required      :   _.get(req,['body','amount_required'],1000),
        campaignRequirement :  _.get(req,['body','campaignRequirement'],''),
        quantity:              _.get(req,['body','quantity'],''),
        campaignAddress     : _.get(req, ['body', 'campaignAddress'], ''),
        campaignWalletAddress: deployedCampaignAddress
      };

      if(!db_details.campaignName || !db_details.campaignCause || !db_details.campaignDiscription  || !db_details.amount_required){
        
        let invalidDetailError = {
          status: true,
          error: _.get(errorCode, 601, ''),
          statusCode: 601
        };

        LOG.console.info("ERROR : " + invalidDetailError.error); //Adding error in the log file
        _.set(req, 'error', invalidDetailError);
        return next();
      }
      

      let details  = await campaignDB.createCampaign(db_details);//Adding a new verified campaign for an organisationDB

      if(!details)
      {          // error: "Error in adding new campaign for an Organisation to the db",
        let invalidOrganisationError = {
          status: true,
          error: _.get(errorCode, 628, ''),
          statusCode: 628
        };

        LOG.console.info("ERROR : " + invalidOrganisationError.error); //Adding error in the log file
        _.set(req, 'error', invalidOrganisationError);
        return next();

      }

      _.set(req, ['body'], {});
      _.set(req, ['body'], details);

      return next();

    }
    catch(error) {
        // error:"organisationDB Error" ,
      let hlError =   {
        status: true,
        error: _.get(errorCode, 603, ''),
        statusCode: 603
      };

      _.set(req, ['error'], hlError);
      return next();

    }
  },

  getSelfCampaign: async (req,res,next)=>{

    try {

      if ( _.get(req, ['error', 'status'], false) )
      {
        return next();
      }

      const organisation_id  = _.get(req, ['body', 'organisation_id'], '');

      if(!organisation_id)
      {
        // 'id missing!',
        let userError = {
          status: true,
          error: _.get(errorCode, 610, ''),
          statusCode: 610
        };

        LOG.console.info("ERROR : " + userError.error); //Adding error in the log file
        _.set(req, ['error'], userError);
        return next();
      }

      let details = await campaignDB.getSelfCampaign(organisation_id);


      _.set(req, ['body'], {});
      _.set(req, ['body', 'campaign'], details);
     

      return next();

    } catch(error) {
     //Error while getting user details
      let userError = {
        status: true,
        error: _. get(errorCode, 642, ''),
        statusCode: 642
      };

      LOG.console.info("ERROR : " + userError.result.error.message); //Adding error in the log file
      _.set(req, 'error', userError);
      return next();

    }
  },

  campaignCompleted: async(req, res, next) => {
    try{

      if ( _.get(req, ['error', 'status'], false) )
      {
        return next();
      }

      const organisation_id  = _.get(req, ['body', 'organisation_id'], ''),
            campaignId = _.get(req, ['body','campaign_id'], '');

      let campaigndetails  = await campaignDB.campaignCompleted(campaignId);//Adding a new verified campaign for an organisationDB

      if(!campaigndetails)
      {          // error: "Error in adding new campaign for an Organisation to the db",
        let invalidCampaignError = {
          status: true,
          error: _.get(errorCode, 649, ''),
          statusCode: 649
        };

        LOG.console.info("ERROR : " + invalidCampaignError.error); //Adding error in the log file
        _.set(req, 'error', invalidCampaignError);
        return next();

      }
///-----------------------------------
      //details has the campaign consignment total amount and vendorWalletAddress //Shaurya
      let amountToSend = (campaigndetails.selectedVendorDetail.consignment_amount) * 1000000000000000000/ 2;
      let contract = new ethers.Contract(campaigndetails.campaignWalletAddress, abi,provider);
      await contract.functions.payVendor(campaigndetails.selectedVendorDetail.vendorWalletAddress ,amountToSend,1);

      _.set(req, ['body'], {});
      _.set(req, ['body', 'campaign_completed'], true);
     
      return next();

    }
    catch(error) {
        // error:"organisationDB Error" ,
      let hlError =   {
        status: true,
        error: _.get(errorCode, 603, ''),
        statusCode: 603
      };

      _.set(req, ['error'], hlError);
      return next();

    }
  }

};