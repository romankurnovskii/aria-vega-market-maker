/**
 * @file assignments.test.ts
 * @description Integration tests for the assignments router PATCH (pause/resume) endpoint.
 *
 * @dependencies node:test, Express, @lp-system/core mocks
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import express from 'express';
import { createAssignmentsRouter } from './assignments.js';

describe('Assignments Router - PATCH pause/resume', () => {
  let app: express.Application;

  let assignments: any[] = [];

  const mockStore = {
    getAssignments: async () => assignments,
    saveAssignment: async (a: any) => {
      const idx = assignments.findIndex((x) => x.id === a.id);
      if (idx >= 0) assignments[idx] = a;
      else assignments.push(a);
    },
    deleteAssignment: async () => {},
  } as any;

  const mockRegistry = {
    register: () => {},
    deregisterByAssignmentId: () => {},
  } as any;

  const mockFactory = { create: () => ({}) } as any;

  before(() => {
    assignments = [{ id: 'asg_1', strategyId: 'spot-balanced', positionId: 'pos_1', mode: 'active', createdAt: 1 }];
    app = express();
    app.use(express.json());
    app.use('/assignments', createAssignmentsRouter(mockStore, mockRegistry, mockFactory));
  });

  const runRequest = (method: string, id: string, body?: any) =>
    new Promise<{ status: number; body: any }>((resolve) => {
      const req: any = {
        method,
        url: `/assignments/${id}`,
        headers: { 'content-type': 'application/json' },
        body: body || {},
      };
      const mockRes: any = {
        statusCode: 200,
        setHeader: () => {},
        getHeader: () => {},
        removeHeader: () => {},
        status: (code: number) => {
          mockRes.statusCode = code;
          return mockRes;
        },
        json: (data: any) => resolve({ status: mockRes.statusCode, body: data }),
      };
      (app as any).handle(req, mockRes);
    });

  test('should pause an existing assignment', async () => {
    const res = await runRequest('PATCH', 'asg_1', { paused: true });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.assignment.paused, true);
    assert.strictEqual(assignments[0].paused, true);
  });

  test('should resume a paused assignment', async () => {
    const res = await runRequest('PATCH', 'asg_1', { paused: false });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.assignment.paused, false);
  });

  test('should reject PATCH without boolean paused', async () => {
    const res = await runRequest('PATCH', 'asg_1', { paused: 'yes' });

    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error);
  });

  test('should return 404 for unknown assignment', async () => {
    const res = await runRequest('PATCH', 'asg_unknown', { paused: true });

    assert.strictEqual(res.status, 404);
    assert.ok(res.body.error);
  });

  after(() => {
    assignments = [];
  });
});
