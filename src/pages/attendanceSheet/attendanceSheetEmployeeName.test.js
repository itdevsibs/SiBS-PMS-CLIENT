import test from 'node:test';
import assert from 'node:assert/strict';
import { getAttendanceEmployeeName } from './attendanceSheetEmployeeName.js';

test('accountName is never substituted for an absent employee name', () => {
  assert.equal(getAttendanceEmployeeName({ employeeUid: '1397', accountName: 'US Visa', status: 'Absent' }, 'US Visa'), '—');
  assert.equal(getAttendanceEmployeeName({ employeeUid: '3635', accountName: 'US Visa', status: 'Rest Day' }, 'US Visa'), '—');
  assert.equal(getAttendanceEmployeeName({ name: 'US Visa', accountName: 'US Visa' }, 'US Visa'), '—');
});

test('specific employee names win; account labels are rejected', () => {
  assert.equal(getAttendanceEmployeeName({ employeeName: 'Jane Dela Cruz', accountName: 'US Visa' }, 'US Visa'), 'Jane Dela Cruz');
  assert.equal(getAttendanceEmployeeName({ employeeName: 'US Visa', gy_emp_fullname: 'Jane Dela Cruz', accountName: 'US Visa' }, 'US Visa'), 'Jane Dela Cruz');
  assert.equal(getAttendanceEmployeeName({ employee: { gy_emp_fullname: 'Juan Santos' }, accountName: 'US Visa' }, 'US Visa'), 'Juan Santos');
  assert.equal(getAttendanceEmployeeName({ gy_emp_fname: 'Juan', gy_emp_mname: 'D', gy_emp_lname: 'Santos', accountName: 'US Visa' }, 'US Visa'), 'Juan D Santos');
});

test('does not trust a generic name field as an employee identity', () => {
  assert.equal(getAttendanceEmployeeName({ name: 'Jane Dela Cruz', accountName: 'US Visa' }, 'US Visa'), '—');
  assert.equal(getAttendanceEmployeeName({ employeeName: ' US_VISA ', accountName: 'US Visa' }, 'US Visa'), '—');
});
