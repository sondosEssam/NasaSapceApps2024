echo "installing required dependencies"
npm install
PID=$(sudo lsof -t -i :5173)

# Check if a PID was found on port 5173
if [ -n "$PID" ]; then
  echo "Killing process with PID $PID on port 5173"
  sudo kill -9 $PID
else
  echo "No process is using port 5173"
fi
echo "starting the server"
npm run dev