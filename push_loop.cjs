const { exec } = require('child_process');

function push() {
  exec('git push origin main', (err, stdout, stderr) => {
    if (err) {
      console.log('Failed, retrying in 5 seconds...', stderr);
      setTimeout(push, 5000);
    } else {
      console.log('Success!', stdout);
    }
  });
}

push();
