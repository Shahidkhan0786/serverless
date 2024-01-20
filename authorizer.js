import { CognitoJwtVerifier } from "aws-jwt-verify";

// Verifier that expects valid access tokens:
const verifier = CognitoJwtVerifier.create({
  userPoolId: "ap-south-1_hoozuxzIt",
  tokenUse: "id",
  clientId: "77s76gn79mphugmcvq57n4s1pd",
});

const generatePolicy = (principalId, effect, resource) => {
  let authResponse = {};
  authResponse.principalId = principalId;

  if (effect && resource) {
    let policyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: effect,
          Action: "execute-api:Invoke",
          resource: resource,
        },
      ],
    };
    authResponse.policyDocument = policyDocument;
  }

  authResponse.context = {
    id: 1,
    name: "shahid",
  };

  console.log("auth res ret", JSON.stringify(authResponse));
  return authResponse;
};

exports.handler = async (event, context) => {
  // Use async syntax directly
  try {
    const token = event.headers.Authorization?.split(" ")[1]; // Optional chaining

    console.log("my token", token);

    const payload = await verifier.verify(token); // Verify before switch

    console.log("Token is valid. Payload:", payload);

    // Extract user information from payload
    const userSub = payload.sub;

    // Generate policy based on user information or other conditions
    const policy = generatePolicy(userSub, "Allow", event.methodArn);

    return { statusCode: 200, body: JSON.stringify(policy) }; // Return response
  } catch (error) {
    console.error("Error:", error);
    return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  }
};

// exports.handler = async (event, context, cb) => {
//   const token = event.headers["Authorization"].split(" ")[1];

//   console.log("my token", token);
//   try {
//     const payload = await verifier.verify(
//       token // the JWT as string
//     );

//     console.log("Token is valid. Payload:", payload);
//   } catch {
//     console.log("Token not valid!");
//   }

//   switch (token) {
//     case "allow":
//       console.log("allow");
//       generatePolicy("user", "Allow", event.methodArn);
//       break;
//     case "deny":
//       console.log("deny");
//       generatePolicy("user", "Deny", event.methodArn);
//       break;
//     default:
//       console.log("deny by default");
//       return generatePolicy("unauthorized", "Deny", event.methodArn);
//   }
// };
