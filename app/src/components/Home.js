import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import Modal from "@mui/material/Modal";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Link from "@mui/material/Link";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useState, useEffect } from "react";
import axios from "axios";

function Copyright() {
  return (
    <Typography variant="body2" color="text.secondary" align="center">
      {"Copyright © "}
      <Link color="inherit" href="https://github.com/jasonjylin/">
        jasonjylin
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3,
};

const theme = createTheme();

const baseURL = "http://localhost:5000";
const redditURL = "https://reddit.com";

export default function Home() {
  const [subReddits, setSubreddits] = useState([]);
  const [subReddit, setSubreddit] = useState("");
  const [open, setOpen] = useState(false);
  const [newPosts, setNewPosts] = useState([]);

  const [subRedditPosts, setSubredditPosts] = useState({});

  useEffect(() => {
    let timerId = refreshTimer;

    return () => {
      clearInterval(timerId)
    }
  }, []);

  useEffect(() => {
    subReddits.forEach((sub) => getSubredditPosts(sub));
  }, [subReddits]);

  const refreshTimer = setInterval(() => {
    if(subReddits.length > 0){
      subReddits.forEach((sub) => getSubredditPosts(sub));
    }
  }, 10000);

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (event) => {
    setSubreddit(event.target.value);
  };

  const getSubredditPosts = (input) => {
    axios.get(`${baseURL}/subreddit/${input}`).then((res) => {
      setSubredditPosts({ ...subRedditPosts, [input]: res.data });
    });
  };

  const getNewPosts = (params) => {
    axios
      .get(`${baseURL}/posts`, {
        params: {
          subreddits: params,
        },
      })
      .then((res) => {
        let newPostTitles = res.data.posts.map((e) => e.title);
        let newPostArray = newPostTitles.filter((x) => !newPosts.includes(x));
        setNewPosts((newPosts) => [...newPosts, ...newPostArray]);
      });
  };

  const markAsRead = (params) => {
    axios
      .post(`${baseURL}/posts`, {
        params: {
          type: "one",
          title: params,
        },
      })
      .then(() => {
        newPosts.splice(newPosts.indexOf(params), 1);
        getNewPosts(subReddits);
      });
  };

  const markAllAsRead = () => {
    axios
      .post(`${baseURL}/posts`, {
        params: {
          type: "all",
        },
      })
      .then(() => {
        newPosts.splice(0, newPosts.length);
        getNewPosts(subReddits);
      });
  };

  const addSubreddit = () => {
    if (subReddit) {
      setSubreddits((subReddits) => [...subReddits, subReddit]);
      setSubreddit("");
    } else {
      console.log("error adding subreddit");
      setSubreddit("");
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="relative">
        <Toolbar>
          <Box display="flex" flexGrow={1}>
            <Typography variant="h6" color="inherit" noWrap>
              ReadIt
            </Typography>
          </Box>
          <Button
            onClick={handleOpen}
            variant="contained"
            color="success"
            align="center"
          >
            View New Posts
          </Button>
        </Toolbar>
      </AppBar>
      <main>
        <Box
          sx={{
            bgcolor: "background.paper",
            pt: 4,
            pb: 6,
          }}
        >
          <Container maxWidth="sm">
            <Typography
              component="p"
              variant="p"
              align="center"
              color="text.primary"
              gutterBottom
            >
              Current Subreddits: {subReddits.join(", ")}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <TextField
                id="outlined-name"
                label="Subreddit"
                value={subReddit}
                onChange={handleChange}
              />
              <Button variant="contained" onClick={addSubreddit}>
                Add Subreddit
              </Button>
            </Stack>
          </Container>
        </Box>
        <Container sx={{ py: 2 }} maxWidth="100%">
          <Grid container spacing={4}>
            {subReddits.map((sub) => (
              <Grid item key={sub} xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <List sx={{ width: "100%", bgcolor: "background.paper" }}>
                      {!!subRedditPosts[sub]?.posts &&
                        subRedditPosts[sub].posts.map((e) => (
                          <ListItem
                            sx={{ width: "100%", textDecoration: "none" }}
                            key={e.title}
                            component="a"
                            href={redditURL + e.link}
                            target="_blank"
                          >
                            <ListItemText
                              sx={{ textDecoration: "none", color: "black" }}
                            >
                              {e.title}
                            </ListItemText>
                          </ListItem>
                        ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="parent-modal-title"
          aria-describedby="parent-modal-description"
        >
          <Box sx={{ ...modalStyle, width: "50%" }}>
            <Paper
              style={{
                maxHeight: "600px",
                overflow: "auto",
                marginBottom: "20px",
              }}
            >
              <List
                sx={{
                  width: "100%",
                  bgcolor: "background.paper",
                }}
              >
                {newPosts.length > 0 &&
                  newPosts.map((e) => (
                    <ListItem
                      key={e}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => markAsRead(e)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText>{e}</ListItemText>
                    </ListItem>
                  ))}
              </List>
            </Paper>
            <Button
              variant="contained"
              onClick={() => {
                getNewPosts(subReddits);
              }}
            >
              Refresh
            </Button>
            <Button
              sx={{ marginLeft: "10px" }}
              variant="contained"
              onClick={() => {
                markAllAsRead();
              }}
            >
              Mark All As Read
            </Button>
          </Box>
        </Modal>
      </main>
      <Box sx={{ bgcolor: "background.paper", p: 6 }} component="footer">
        <Copyright />
      </Box>
    </ThemeProvider>
  );
}
