# Postman Collection Maintenance Rule

As a professional AI coding assistant, you are responsible for keeping the API documentation and testing tools in sync with the backend implementation.

## Mandatory Sync Trigger

Every time you add, modify, or remove a REST API endpoint or change a request/response payload, you **MUST** update the corresponding Postman collection files.

## Collection Location

The collection is stored as a set of YAML files at:
`~/dev/github/privates/postman/postman/collections/Meteora LP Bot API`

## Requirements

1.  **Endpoints**: Ensure all routes defined in `backend/src/routes` and `backend/src/server.ts` have a corresponding `.request.yaml` file.
2.  **Payloads**: Match the JSON body in `content` with the latest TypeScript interfaces and validation logic.
3.  **Ports & URLs**: Use `{{baseUrl}}` for the base URL. If the production port changes (e.g., in `docker-compose.prod.yml`), verify if any hardcoded values need updating.
4.  **Order**: Maintain a logical execution order using the `order` property (e.g., 1000 for primary actions, 5000 for utility/health).
5.  **Variables**: Ensure common variables like `{{poolAddress}}` and `{{positionAddress}}` are used consistently to allow for environment-based testing.

## Proactive Verification

Before finishing a task, verify the integrity of the YAML files and ensure no new endpoints are left undocumented.
