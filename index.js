'use strict';


/**
 * @name exist
 * @description mongoose plugin to ensure assigned ref(s) already exists
 * @license MIT
 * @author lally elias <lallyelias87@mail.com>
 * @since  0.1.0
 * @version 0.1.0
 * @example
 *
 * const PersonSchema = new Schema({
 *   
 *   father: {
 *     type: ObjectId,
 *     ref: 'Person',
 *     exists: true
 *   }
 *   
 * });
 */


/* dependencies */
const _ = require('lodash');
const mongoose = require('mongoose');
const VALIDATOR_TYPE = 'exists';


module.exports = exports = function (schema /*, options*/ ) {

  /**
   * @name  exists
   * @description iterate though each schema path, check for ObjectId(ref) 
   * schema fields and apply exists plugin to a schema type(s) 
   * with `exists:true` options
   *              
   * @param {String} schemaPath schema path
   * @param {SchemaType} schemaType valid mongoose schema type
   */
  function exists(schemaPath, schemaType) {

    //handle sub-schema
    if (schemaType.schema) {
      schemaType.schema.eachPath(function (_schemaPath, _schemaType) {
        exists(_schemaPath, _schemaType);
      });
    }

    //collect schemaType options
    let schemaTypeOptions = {};
    schemaTypeOptions = _.merge({}, schemaType.options); //normal
    schemaTypeOptions =
      _.merge({}, schemaTypeOptions, _.get(schemaType, 'caster.options')); //caster

    //ensure schema type is objectid `ref`
    const hasRef = !_.isEmpty(schemaTypeOptions.ref);

    //check for exist schema options
    const hasExistOption = schemaTypeOptions.exists === true;

    //check if is allow exist schema type
    const checkExist = hasRef && hasExistOption;

    //handle `exist:true` schema options
    if (checkExist && _.isFunction(schemaType.validate)) {

      //check if exist validator already added to path
      const hasValidator =
        _.find(schemaType.validators, { type: VALIDATOR_TYPE });

      //add model exists async validation
      if (!hasValidator) {
        schemaType.validate({
          isAsync: true,
          validator: function (value, cb) {

            //map value to array
            let ids = [].concat(value);

            //get objectid of the value
            ids = _.map(ids, function (id) {
              return _.get(id, '_id') || id;
            });
            ids = _.compact(ids);

            //extend path validation with existence checks
            if (ids && ids.length > 0) {

              //obtain ref mongoose model
              const Model = mongoose.model(schemaTypeOptions.ref);

              //try to lookup for model(s) by their ids
              Model
                .find({ _id: { $in: ids } })
                .select('_id')
                .lean()
                .exec(function (error, docs) {

                  //handle query errors
                  if (error) {
                    cb(false /*, error*/ );
                  }

                  //handle ref(s) existence
                  else {

                    //check if documents already exist
                    if (docs && docs.length === ids.length) {
                      cb(true);
                    }

                    //documents not saved already
                    else {
                      cb(false);
                    }

                  }

                });
            }

            //continue if not ids
            else {
              cb(true);
            }

          },
          message: '{PATH} with id {VALUE} does not exists',
          type: VALIDATOR_TYPE
        });
      }

    }

  }

  //check paths for existence
  schema.eachPath(exists);

};