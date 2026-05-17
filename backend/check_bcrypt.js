const bcrypt = require('bcryptjs');
const adminHash = '$2a$12$bQZ7Y2dFGrVfdWrrxpqxKuJL/wwWHkGbz2JfxpPQcbnV37VsakFS6';
const jatinHash = '$2a$12$vAqVC.zuQZGoawfEJsXJaeGWRd6AUghHB1y3MjDt.Sx7ky7/XZ9kq';

bcrypt.compare('password123', adminHash).then(res => {
  console.log('Compare password123 with admin hash:', res);
});
bcrypt.compare('password123', jatinHash).then(res => {
  console.log('Compare password123 with jatin hash:', res);
});
