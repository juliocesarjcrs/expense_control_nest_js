module.exports = {
  apps : [{
    name: 'expense_control_nest_js',
    script: 'dist/main.js',
    watch: false,
    env_production: {
      NODE_ENV: "production",
    }
  }],
};
