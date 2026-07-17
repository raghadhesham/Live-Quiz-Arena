// Basic read operations
export const findOne = async({
    model,
    filter={},
    select = '',
    options={}
} = {}) => {
    return await model.findOne(filter).select(select).setOptions(options)
}

export const findById = async({
    model,
    id,
    select = '',
    options = {}
} = {}) => {
    return await model.findById(id).select(select).setOptions(options)
}

export const find = async ({
  model,
  filter = {},
  select = "",
  options = {},
  populate = "",
} = {}) => {
  let query = model.find(filter).select(select).setOptions(options);
  if (populate) {
    query = query.populate(populate);
  }
  return await query;
};

// Create operations
export const create = async ({
    model,
    data = {},
    options={validateBeforeSave:true}
 } = {}) => {
    return await model.create(data)
}

export const createOne = async ({
    model,
    data = {},
    options={validateBeforeSave:true}
 } = {}) => {
    const doc = await create({ model, data: [data], options })
    return doc[0]
}

// Update operations
export const findByIdAndUpdate = async({
    model,
    id,
    update = {},
    select = '',
    options = { new: true, runValidators: true }
} = {}) => {
    let query = model.findByIdAndUpdate(id, update, options);
    if (select) {
        query = query.select(select);
    }
    return await query
}
export const findOneAndUpdate = async({
    model,
    filter={},
    update = {},
    select = '',
    options = { new: true, runValidators: true }
} = {}) => {
    let query = model.findOneAndUpdate(filter, update, options);
    if (select) {
        query = query.select(select);
    }
    return await query
}

export const findByIdAndReplace = async ({
  model,
  id,
  data = {},
  options = { new: true, runValidators: true },
} = {}) => {
  return await model.findOneAndReplace({ _id: id }, data, options);
};

export const updateMany = async ({
  model,
  filter = {},
  update = {},
  options = {}, 
} = {}) => {
  return await model.updateMany(filter, update, options);
};
export const updateOne = async ({
  model,
  filter = {},
  update = {},
  options = {}, 
} = {}) => {
  return await model.updateOne(filter, update, options)
};

// Delete operations
export const findByIdAndDelete = async ({ 
  model, 
  id, 
  options = {} 
} = {}) => {
  return await model.findByIdAndDelete(id, options);
};

export const deleteMany = async ({ 
  model, 
  filter = {}, 
  options = {} 
} = {}) => {
  return await model.deleteMany(filter, options);
};

// Aggregation
export const aggregate = async ({ 
  model, 
  pipeline = [] 
} = {}) => {
  return await model.aggregate(pipeline);
};