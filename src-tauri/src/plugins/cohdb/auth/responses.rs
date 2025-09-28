use std::collections::HashMap;

use reqwest::{Response, StatusCode};
use serde::{Deserialize, Serialize};

use crate::plugins::cohdb::auth::error::Error::Http;
use crate::plugins::cohdb::auth::error::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub name: String,
    pub profile_id: Option<u64>,
    pub steam_id: u64,
}

#[derive(Debug)]
pub enum MeResponse {
    Ok(User),
    Unauthenticated,
    #[allow(dead_code)]
    ServerError(u16),
}

impl MeResponse {
    pub async fn from_response(res: Response) -> Result<Self> {
        match res.status() {
            StatusCode::OK => Ok(Self::Ok(res.json::<User>().await.map_err(Http)?)),
            StatusCode::UNAUTHORIZED => Ok(Self::Unauthenticated),
            _ => Ok(Self::ServerError(res.status().as_u16())),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Replay {
    pub download_link: String,
}

type ErrorMessages = HashMap<String, Vec<String>>;

#[derive(Debug, Clone)]
pub enum UploadResponse {
    Ok(Replay),
    Unauthenticated,
    Unauthorized,
    #[allow(dead_code)]
    UploadError(ErrorMessages),
    #[allow(dead_code)]
    ServerError(u16),
}

impl UploadResponse {
    pub async fn from_response(res: Response) -> Result<Self> {
        match res.status() {
            StatusCode::OK => Ok(Self::Ok(res.json::<Replay>().await.map_err(Http)?)),
            StatusCode::UNPROCESSABLE_ENTITY => Ok(Self::UploadError(
                res.json::<ErrorMessages>().await.map_err(Http)?,
            )),
            StatusCode::UNAUTHORIZED => Ok(Self::Unauthenticated),
            StatusCode::FORBIDDEN => Ok(Self::Unauthorized),
            _ => Ok(Self::ServerError(res.status().as_u16())),
        }
    }
}
