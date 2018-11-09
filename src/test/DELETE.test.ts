import request from 'supertest-as-promised';
import {
  projectBasePath,
  contentTypeJSON,
  contentTypeText,
  basePathWithoutProjectValue,
  projectWithoutEndpointsBasePath,
} from './config';

describe('Tests for testmocker.json - DELETE', () => {
  it('[DELETE] - Should return 200 for empty body', async () => {
    const res = await request(projectBasePath)
      .delete('/empty')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(res.body).toEqual({});
  });
  it('[DELETE] - Should return 200 with object as body with specific string value', async () => {
    const res = await request(projectBasePath)
      .delete('/object')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.hey).toBe('string');
    expect(res.body.hey).toBe('I am working');
  });
  it('[DELETE] - Should return 200 with object as body with specific number value', async () => {
    const res = await request(projectBasePath)
      .delete('/object')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.num).toBe('number');
    expect(res.body.num).toBe(4);
  });
  it('[DELETE] - Should return 200 with object as body with specific boolean value', async () => {
    const res = await request(projectBasePath)
      .delete('/object')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.valid).toBe('boolean');
    expect(res.body.valid).toBe(true);
  });
  it('[DELETE] - Should return 200 with raw response with specific string', async () => {
    const res = await request(projectBasePath)
      .delete('/string')
      .expect(200)
      .expect('Content-Type', contentTypeText);
    expect(res.text).toBe('response');
  });
  it('[DELETE] - Should return 404', async () => {
    const res = await request(projectBasePath)
      .delete('/unknown')
      .expect(404);
  });
  it('[DELETE - params] - Should return 200 for empty body', async () => {
    const res = await request(projectBasePath)
      .delete('/empty?param=value')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(res.body).toEqual({});
  });
  it('[DELETE - params] - Should return 200 with JSON response with specific string value', async () => {
    const res = await request(projectBasePath)
      .delete('/object?param=value')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.hey).toBe('string');
    expect(res.body.hey).toBe('I am working with params');
  });
  it('[DELETE - params] - Should return 200 with JSON response with specific number value', async () => {
    const res = await request(projectBasePath)
      .delete('/object?param=value')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.num).toBe('number');
    expect(res.body.num).toBe(8);
  });
  it('[DELETE - params] - Should return 200 with JSON response with specific boolean value', async () => {
    const res = await request(projectBasePath)
      .delete('/object?param=value')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.valid).toBe('boolean');
    expect(res.body.valid).toBe(false);
  });
  it('[DELETE - params] - Should return 404 with wrong parameters - JSON response', async () => {
    const res = await request(projectBasePath)
      .delete('/object?parameter=value_is_not_correct')
      .expect(404);
  });
  it('[DELETE - params] - Should return 200 with raw response with specific string', async () => {
    const res = await request(projectBasePath)
      .delete('/string?param=value')
      .expect(200)
      .expect('Content-Type', contentTypeText);
    expect(res.text).toBe('response with params');
  });
  it('[DELETE - params] - Should return 404 with wrong parameters - raw response', async () => {
    const res = await request(projectBasePath)
      .delete('/string?parameter=value_is_not_correct')
      .expect(404);
  });
  it('[DELETE - params] - Should return 404', async () => {
    const res = await request(projectBasePath)
      .delete('/unknown?param=value')
      .expect(404);
  });
  it('[DELETE - no project value] - Should return 404', async () => {
    const res = await request(basePathWithoutProjectValue)
      .delete('/endpoint')
      .expect(404);
  });
  it('[DELETE - project without endpoints] - Should return 404', async () => {
    const res = await request(projectWithoutEndpointsBasePath)
      .delete('/endpoint')
      .expect(404);
  });
});
