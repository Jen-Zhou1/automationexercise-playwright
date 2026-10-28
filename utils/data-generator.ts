/**
 * 测试数据生成器（utils/data-generator.ts）
 * ---------------------------------------------------------------------------
 * 为什么需要它：站点是共享演示站，账号数据会持久化。
 * 每次运行生成"唯一邮箱 + 随机姓名"，避免 "Email Address already exist!" 冲突，
 * 保证任意并发/重复执行都互不影响（数据驱动 + 幂等的基础）。
 */
import { randomUUID } from 'node:crypto';
import { env } from '../config/env';
import { ADDRESS } from '../testdata/address';
import type { TestUser } from '../testdata/users';

const FIRST_NAMES = ['Wei', 'Yun', 'Auto', 'Qa', 'Lena', 'Marco', 'Sara', 'Kenji'];
const LAST_NAMES = ['Zhang', 'Wang', 'Tester', 'Engineer', 'Nguyen', 'Silva'];

function pick<T>(list: readonly T[]): T {
  const index = Math.floor(Math.random() * list.length);
  const value = list[index];
  if (value === undefined) {
    throw new Error(`pick() 索引越界：${index}`);
  }
  return value;
}

/** 唯一邮箱：qa_<时间戳>_<随机串>@example.com */
export function uniqueEmail(prefix = 'qa'): string {
  return `${prefix}_${Date.now()}_${randomUUID().replace(/-/g, '')}@example.com`;
}

/** 生成一个完整可注册的测试用户（字段与站点注册表单一一对应） */
export function generateUser(overrides: Partial<TestUser> = {}): TestUser {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  return {
    name: `${firstName} ${lastName}`,
    email: uniqueEmail(),
    password: env.testUserPassword,
    title: 'Mr',
    firstName,
    lastName,
    company: ADDRESS.company,
    address1: ADDRESS.address1,
    address2: ADDRESS.address2,
    country: ADDRESS.country,
    state: ADDRESS.state,
    city: ADDRESS.city,
    zipcode: ADDRESS.zipcode,
    mobile: ADDRESS.mobile,
    birth: { day: '15', month: '6', year: '1995' },
    ...overrides,
  };
}
