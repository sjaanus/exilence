using Exilence.Helper;
using Exilence.Interfaces;
using Exilence.Models;
using Exilence.Models.Ladder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace Exilence.Services
{
    public class LadderService : ILadderService
    {
        private readonly IHostingEnvironment _env;
        private readonly ILogger<LadderService> _log;
        private readonly IExternalService _externalService;
        private IStoreRepository _storeRepository;
        private IRedisRepository _redisRepository;

        private const string LadderUrl = "http://www.pathofexile.com/api/ladders";
        private const string LeagesUrl = "http://api.pathofexile.com/leagues?type=main&compact=1";
        private const string PoeNinjaStatsUrl = "http://poe.ninja/api/Data/GetStats";
        private const string TradeUrl = "http://api.pathofexile.com/public-stash-tabs";

        public LadderService(
            ILogger<LadderService> log,
            IExternalService externalService,
            IHostingEnvironment env,
            IStoreRepository storeRepository,
            IRedisRepository redisRepository
            )
        {
            _log = log;
            _env = env;
            _externalService = externalService;
            _storeRepository = storeRepository;
            _redisRepository = redisRepository;
        }

        #region Leagues
        private async Task<List<LeagueApiModel>> FetchLeaguesAsync()
        {
            var json = await _externalService.ExecuteGetAsync(LeagesUrl);
            return JsonConvert.DeserializeObject<List<LeagueApiModel>>(json);
        }

        #endregion

        #region Ladder

        public async Task<List<LadderPlayerModel>> GetLadderForLeague(string leagueName, bool full = false)
        {
            var league = await _redisRepository.GetLeagueLadder(leagueName);
            if (league == null)
            {
                await _redisRepository.SetLeagueLadderPending(leagueName);
            }
            else
            {
                if (league.Ladder != null)
                {
                    if (full)
                    {
                        return league.Ladder.OrderBy(t => t.Rank.Overall).ToList();
                    }
                    else
                    {
                        return league.Ladder.OrderBy(t => t.Rank.Overall).Take(10).ToList();
                    }
                }
            }

            return null;
        }

        public async Task<LadderModel> GetLadder(string leagueName, string character)
        {
            var league = await _redisRepository.GetLeagueLadder(leagueName);
            if (league == null)
            {
                await _redisRepository.SetLeagueLadderPending(leagueName);
            }
            else
            {
                if (league.Ladder != null)
                {
                    var ladderCharacter = league.Ladder.FirstOrDefault(t => t.Name == character);
                    if (ladderCharacter != null)
                    {
                        var ladder = GetLadderForCharacter(league, ladderCharacter);
                        var classLadder = GetClassLadderForCharacter(league, ladderCharacter);
                        var groupLadder = GetGroupDepthLadderForCharacter(league, ladderCharacter);
                        var soloLadder = GetSoloDepthLadderForCharacter(league, ladderCharacter);

                        var ladderModel = new LadderModel()
                        {
                            OverallLadder = ladder,
                            ClassLadder = classLadder,
                            DepthGroupLadder = groupLadder,
                            DepthSoloLadder = soloLadder
                        };
                        return ladderModel;

                    }
                }
            }
            return null;
        }


        private List<LadderPlayerModel> GetLadderForCharacter(LadderStoreModel league, LadderPlayerModel character)
        {
            if (character != null)
            {
                var index = league.Ladder.IndexOf(character);
                return GetPartOfLadder(index - 5, index + 5, league.Ladder);
            }
            return null;
        }

        private List<LadderPlayerModel> GetClassLadderForCharacter(LadderStoreModel league, LadderPlayerModel character)
        {
            if (character != null)
            {
                var leagueLadder = league.Ladder
                       .Where(t => t.Class == character.Class)
                       .OrderBy(t => t.Rank.Class)
                       .ToList();

                var index = leagueLadder.IndexOf(character);
                return GetPartOfLadder(index - 5, index + 5, leagueLadder);
            }
            return null;
        }

        private List<LadderPlayerModel> GetGroupDepthLadderForCharacter(LadderStoreModel league, LadderPlayerModel character)
        {
            if (character != null)
            {
                var leagueLadder = league.Ladder.OrderByDescending(t => t.Depth.Group).ToList();
                var index = leagueLadder.IndexOf(character);
                return GetPartOfLadder(index - 5, index + 5, leagueLadder);
            }
            return null;
        }

        private List<LadderPlayerModel> GetSoloDepthLadderForCharacter(LadderStoreModel league, LadderPlayerModel character)
        {
            if (character != null)
            {
                var leagueLadder = league.Ladder.OrderByDescending(t => t.Depth.Solo).ToList();
                var index = leagueLadder.IndexOf(character);
                return GetPartOfLadder(index - 5, index + 5, leagueLadder);
            }
            return null;
        }

        private List<LadderPlayerModel> GetPartOfLadder(int from, int to, List<LadderPlayerModel> ladder)
        {
            var result = new List<LadderPlayerModel>();
            for (int i = from; i <= to; i++)
            {
                var element = ladder.ElementAtOrDefault(i);
                if (element != null)
                {
                    result.Add(element);
                }
            }
            return result;
        }

        public async Task UpdateLadders()
        {
            var leagues = await _redisRepository.GetAllLeaguesLadders();
            if (leagues != null)
            {
                var anyRunning = leagues.Any(t => t.Running);
                var pendingLeague = leagues.OrderByDescending(t => t.Finished).LastOrDefault();

                if (!anyRunning)
                {
                    if (pendingLeague != null)
                    {
                        if (pendingLeague.Finished < DateTime.Now.AddMinutes(-5))
                        {
                            await UpdateLadder(pendingLeague.Name);
                        }
                    }
                }
            }
        }

        private async Task UpdateLadder(string leagueName)
        {
            await _redisRepository.SetLeagueLadderRunning(leagueName);

            var league = await _redisRepository.GetLeagueLadder(leagueName);
            var oldLadder = league.Ladder;
            var newLadder = new List<LadderPlayerModel>();

            var pages = Enumerable.Range(0, 25);
            using (var rateGate = new RateGate(2, TimeSpan.FromSeconds(2))) // 1 second is ok but testing 2 for performance
            {
                foreach (int page in pages)
                {
                    await rateGate.WaitToProceed();
                    LadderApiResponse result = await FetchLadderApiPage(leagueName, page);
                    if (result != null)
                    {
                        var LadderPlayerList = result.Entries.Select(t => new LadderPlayerModel()
                        {
                            Name = t.Character.Name,
                            Level = t.Character.Level,
                            Online = t.Online,
                            Dead = t.Dead,
                            Account = t.Account.Name,
                            Experience = t.Character.Experience,
                            ExperiencePerHour = 0,
                            Rank = new LadderPlayerRankModel()
                            {
                                Overall = t.Rank
                            },
                            Depth = new LadderPlayerDepthModel()
                            {
                                Solo = t.Character.Depth != null ? t.Character.Depth.Solo : 0,
                                Group = t.Character.Depth != null ? t.Character.Depth.@default : 0
                            },
                            Twitch = t.Account.Twitch?.Name,
                            Class = t.Character.Class,
                            Updated = DateTime.Now
                        }).ToList();
                        // Convert result to LadderPlayer model here
                        newLadder.AddRange(LadderPlayerList);
                        if (newLadder.Count == result.Total || result.Entries.Count == 0)
                        {
                            break;
                        }
                    }
                    else
                    {
                        await _redisRepository.RemoveLeagueLadder(leagueName);
                        break;
                    }
                }
            }

            if (newLadder.Count > 0)
            {
                newLadder = CalculateStatistics(oldLadder, newLadder);
                await _redisRepository.UpdateLeagueLadder(leagueName, newLadder);
            }
        }

        private List<LadderPlayerModel> CalculateStatistics(List<LadderPlayerModel> oldLadder, List<LadderPlayerModel> newLadder)
        {
            foreach (var newEntry in newLadder)
            {
                newEntry.Depth.Group = newLadder.Count(t => t.Depth.Group > newEntry.Depth.Group) + 1;
                newEntry.Depth.Solo = newLadder.Count(t => t.Depth.Solo > newEntry.Depth.Solo) + 1;
                newEntry.Rank.Class = newLadder.Where(t => t.Class == newEntry.Class).Where(x => x.Rank.Overall < newEntry.Rank.Overall).Count() + 1;

                if (oldLadder != null)
                {
                    var oldLadderEntry = oldLadder.FirstOrDefault(t => t.Name == newEntry.Name);
                    if (oldLadderEntry != null && oldLadderEntry.Updated != DateTime.MinValue)
                    {
                        var expGain = newEntry.Experience - oldLadderEntry.Experience;
                        var oneHour = (1 * 60 * 60);
                        var timeBetweenUpdates = newEntry.Updated.ToUnixTimeStamp() - oldLadderEntry.Updated.ToUnixTimeStamp();
                        var gainOverTime = (oneHour / timeBetweenUpdates) * expGain;
                        newEntry.ExperiencePerHour = (long)gainOverTime;
                    }
                }
            }
            return newLadder;
        }

        public async Task<LadderApiResponse> FetchLadderApiPage(string league, int page)
        {
            var offset = page * 200;
            league = HttpUtility.UrlEncode(league);
            var urlParams = $"offset={offset}&limit=200&id={league}&type=league";
            var url = $"{LadderUrl}?{urlParams}";
            var apiResponse = await HandleLadderRequest(url);
            return apiResponse;
        }

        private async Task<LadderApiResponse> HandleLadderRequest(string url)
        {
            string json = await _externalService.ExecuteGetAsync(url);
            if (json != null)
            {
                return JsonConvert.DeserializeObject<LadderApiResponse>(json);
            }
            return null;
        }


        #endregion

    }
}
