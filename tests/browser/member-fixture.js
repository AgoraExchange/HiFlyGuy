import {test as base,expect} from '@playwright/test';
import {mockMembership} from './member-mock.js';
export {expect};
export const test=base.extend({page:async({page},use)=>{
  await mockMembership(page);
  const goto=page.goto.bind(page);
  page.goto=async(...args)=>{const response=await goto(...args);if(new URL(page.url()).pathname==='/'){await expect(page.locator('#world-splash')).toBeHidden({timeout:15000});await expect(page.locator('body')).toHaveAttribute('data-access','creator',{timeout:15000});}return response;};
  await use(page);
}});
