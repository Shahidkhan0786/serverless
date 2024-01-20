"use strict";
// const AWS = require("aws-sdk");
// const dynamodb = new AWS.DynamoDB.DocumentClient();
const DynamoDB = require("aws-sdk/clients/dynamodb"); // Import only DynamoDB client
const dynamodb = new DynamoDB.DocumentClient({
  region: "us-east-1",
  maxRetries: 3,
  httpOptions: {
    timeout: 5000,
  },
});
const tableName = process.env.TABLE_NAME; // Get table name from environment variable

// module.exports.createNote = async (event, context, cb) => {
//   try {
//     const data = JSON.parse(event.body);
//     const notesId = data.id;
//     const params = {
//       TableName: tableName,
//       Item: {
//         notesId: data.id,
//         title: data.title,
//         body: data.body,
//       },
//       ConditionExpression: "attribute_not_exists(notesId)", // Only create if notesId doesn't exist
//     };

//     await dynamodb.put(params).promise();

//     cb(null, {
//       statusCode: 201,
//       body: JSON.stringify(`Note ${notesId} created successfully!`),
//     });
//   } catch (error) {
//     console.error(error);
//     cb(null, {
//       statusCode: 400,
//       body: JSON.stringify(error.message),
//     });
//   }
// };

module.exports.createNote = async (event, context) => {
  // Remove unnecessary callback parameter
  try {
    const data = JSON.parse(event.body);
    const notesId = data.id;

    const params = {
      // TableName: tableName, // Use environment variable for table name
      TableName: "notes", // Use environment variable for table name
      Item: {
        notesId: data.id, // Assign string directly without { S: ... }
        title: data.title,
        body: data.body,
      },
      ConditionExpression: "attribute_not_exists(notesId)",
    };

    await dynamodb.put(params).promise(); // Use putItem for clarity

    return {
      // Return response object directly
      statusCode: 201,
      body: JSON.stringify(`Note ${notesId} created successfully!`),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 400,
      body: JSON.stringify(error.message),
    };
  }
};

module.exports.updateNote = async (event) => {
  // let noteId = event.pathParameters.id;
  try {
    const notesId = event.pathParameters.id;
    const body = JSON.parse(event.body);

    const params = {
      // TableName: tableName,
      TableName: "notes",
      Key: {
        notesId: notesId,
      },
      // UpdateExpression: "SET content = :body", // Assuming only 'content' can be updated
      // ExpressionAttributeValues: {
      //   ":body": body.body,
      // },

      UpdateExpression: "SET #title = :title, #body = :body", // Update both title and body
      ExpressionAttributeNames: {
        "#title": "title",
        "#body": "body",
      },
      ExpressionAttributeValues: {
        ":title": body.title,
        ":body": body.body,
      },
      ConditionExpression: "attribute_exists(notesId)",
    };
    const res = await dynamodb.update(params).promise();

    res_data = {
      message: `Note ${notesId} updated successfully!`,
      data: res,
    };
    return {
      statusCode: 200,
      data: JSON.stringify(res_data),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 404, // Assuming 404 if note not found
      body: JSON.stringify(error.message),
    };
  }
};

module.exports.deleteNote = async (event) => {
  let notesId = event.pathParameters.id;
  try {
    const params = {
      TableName: "notes",
      Key: {
        notesId: notesId,
      },
      ConditionExpression: "attribute_exists(notesId)",
    };

    await dynamodb.delete(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify("Deleted Successfully"),
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 400,
      body: JSON.stringify(`error in del ${error.message}`),
    };
  }
};

module.exports.allNotes = async (event) => {
  // let noteId = event.pathParameters.id;
  console.log("event", event);
  try {
    const params = {
      TableName: "notes",
    };

    const data = await dynamodb.scan(params).promise();

    // return JSON.stringify({
    //   statusCode: 200,
    //   data: data,
    // });

    return {
      statusCode: 200,
      body: JSON.stringify({
        total: data.Count,
        items: await data.Items.map((customer) => {
          return {
            title: customer.title,
            body: customer.body,
          };
        }),
      }),
    };
  } catch (error) {
    console.log(error);
    return JSON.stringify({
      statusCode: 400,
      message: `Error in list ${error.message}`,
    });
  }
};
